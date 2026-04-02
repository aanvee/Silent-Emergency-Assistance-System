from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime
from pydantic import BaseModel
from textblob import TextBlob
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- Twilio Configuration ---
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TARGET_PHONE_NUMBER = os.getenv("TARGET_PHONE_NUMBER")

# Initialize Twilio Client once globally
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"Failed to initialize Twilio client: {e}")


# Allow all origins per requirements
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlertRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    message: str

class AuthRequest(BaseModel):
    email: str
    password: str

class ContactRequest(BaseModel):
    userId: str
    name: str
    phone: str

class SendAlertsRequest(BaseModel):
    userId: str
    contacts: list

import uuid
# In-memory mock database for demo purposes
users_db = {}      # email -> {"id": str, "email": str, "password": str}
contacts_db = {}   # userId -> [{"id": str, "name": str, "phone": str}]

def check_for_emergency(message: str) -> bool:
    """
    Simple NLP logic combining keyword detection and fallback checks.
    """
    emergency_keywords = ["help", "danger", "emergency", "save me", 
                          "scared", "unsafe", "afraid", "threat", "panic"]
    message_lower = message.lower()
    
    # Fallback check
    if "cry" in message_lower:
        return True
        
    return any(keyword in message_lower for keyword in emergency_keywords)

def analyze_sentiment(message: str) -> float:
    """
    Uses TextBlob to analyze the sentiment of the message.
    Returns a polarity score from -1.0 (very negative) to 1.0 (very positive).
    """
    analysis = TextBlob(message)
    return analysis.sentiment.polarity

def send_sms_alert(message_body: str):
    """
    Uses the globally initialized Twilio client to send an SMS alert.
    Wrapped in a try-except block to ensure the backend never crashes if SMS fails.
    """
    if not twilio_client:
        print("Twilio client is not initialized. Skipping SMS.")
        return
        
    try:
        # Send the SMS
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=TARGET_PHONE_NUMBER
        )
        print(f"SMS Alert sent successfully! Message SID: {message.sid}")
    except Exception as e:
        print(f"Failed to send SMS Alert: {e}")

@app.get("/")
async def root():
    return {"message": "Backend running"}

@app.post("/api/auth/signup")
async def signup(req: AuthRequest):
    if req.email in users_db:
        return {"error": "User already exists"}
    user_id = str(uuid.uuid4())
    users_db[req.email] = {"id": user_id, "email": req.email, "password": req.password}
    contacts_db[user_id] = []
    return {"user": {"id": user_id, "email": req.email}}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    user = users_db.get(req.email)
    if not user or user["password"] != req.password:
        return {"error": "Invalid email or password"}
    return {"user": {"id": user["id"], "email": user["email"]}}

@app.post("/api/contacts")
async def add_contact(req: ContactRequest):
    if req.userId not in contacts_db:
        contacts_db[req.userId] = []
    new_contact = {"id": str(uuid.uuid4()), "name": req.name, "phone": req.phone}
    contacts_db[req.userId].append(new_contact)
    return {"status": "Contact added", "contact": new_contact}

@app.get("/api/contacts")
async def get_contacts(userId: str):
    user_contacts = contacts_db.get(userId, [])
    return {"contacts": user_contacts}

@app.post("/api/alerts/send")
async def send_manual_alerts(req: SendAlertsRequest):
    # Sends an SMS alert to each target contact manually
    timestamp = datetime.utcnow().isoformat() + "Z"
    for contact in req.contacts:
        sms_body = (
            f"🚨 SILENT EMERGENCY ALERT 🚨\n"
            f"User ID: {req.userId}\n"
            f"Message: Protocol V.911 Manual Trigger\n"
            f"Recipient: {contact.get('name', 'Contact')}\n"
            f"Time: {timestamp}"
        )
        send_sms_alert(sms_body)
    return {"status": "Alerts Dispatched"}

@app.post("/alert")
async def handle_alert(alert: AlertRequest):
    has_keywords = check_for_emergency(alert.message)
    sentiment_score = analyze_sentiment(alert.message)
    
    # Hybrid Logic: Emergency if keywords match OR sentiment is very negative
    has_negative_sentiment = sentiment_score < -0.2
    
    is_emergency = has_keywords or has_negative_sentiment
    
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    if is_emergency:
        # Determine the trigger type
        trigger_type = "both" if has_keywords and has_negative_sentiment else ("keyword" if has_keywords else "sentiment")
        
        # Print alert details in terminal
        print("\n" + "="*40)
        print("!!! EMERGENCY ALERT DETECTED !!!")
        print("="*40)
        print(f"Time     : {timestamp}")
        print(f"Trigger  : {trigger_type}")
        print(f"User ID  : {alert.user_id}")
        print(f"Location : Lat: {alert.latitude}, Lng: {alert.longitude}")
        print(f"Message  : {alert.message}")
        print(f"Sentiment: {sentiment_score:.2f} (Polarity)")
        print("="*40 + "\n")
        
        # Construct and send the SMS alert
        maps_link = f"https://maps.google.com/?q={alert.latitude},{alert.longitude}"
        sms_body = (
            f"🚨 SILENT EMERGENCY ALERT 🚨\n"
            f"User ID: {alert.user_id}\n"
            f"Message: \"{alert.message}\"\n"
            f"Location: {maps_link}\n"
            f"Time: {timestamp}"
        )
        send_sms_alert(sms_body)
        
        return {
            "status": "Alert sent",
            "sentiment": sentiment_score,
            "trigger_type": trigger_type,
            "timestamp": timestamp,
            "data": alert.dict()
        }
    else:
        return {
            "status": "No emergency detected",
            "sentiment": sentiment_score,
            "timestamp": timestamp
        }
