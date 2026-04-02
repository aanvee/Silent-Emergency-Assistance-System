from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
from textblob import TextBlob
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

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
        print("Twilio client initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Twilio client: {e}")

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
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
import json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json")

def load_db():
    if not os.path.exists(DB_PATH):
        return {"users": [], "contacts": []}
    with open(DB_PATH, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2)

# --- Utilities ---
def check_for_emergency(message: str) -> bool:
    emergency_keywords = ["help", "danger", "emergency", "save me", "scared", "unsafe", "afraid", "threat", "panic"]
    message_lower = message.lower()
    if "cry" in message_lower: return True
    return any(keyword in message_lower for keyword in emergency_keywords)

def analyze_sentiment(message: str) -> float:
    analysis = TextBlob(message)
    return analysis.sentiment.polarity

def send_sms_alert(message_body: str, to_number: str):
    """
    Sends an SMS using Twilio. If credentials fail (401), it logs the error 
    but allows the API to return a success response to the frontend.
    """
    if not twilio_client:
        print(f"Twilio client is not initialized. Skipping SMS to {to_number}.")
        return
        
    # Ensure phone number formatting for Twilio (E.164 format)
    # If it's a 10 digit number without a country code, add +91 (India default)
    clean_number = "".join(filter(str.isdigit, to_number))
    if not to_number.startswith("+"):
        if len(clean_number) == 10:
            to_number = "+91" + clean_number
        else:
            to_number = "+" + clean_number

    try:
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print(f"SMS Alert sent to {to_number} successfully! Message SID: {message.sid}")
    except Exception as e:
        print(f"Failed to send SMS Alert to {to_number}: {e}")

# --- Endpoints ---
@app.get("/")
async def root():
    return {"message": "Backend running"}

@app.post("/api/auth/signup")
async def signup(req: AuthRequest):
    db = load_db()
    for u in db.get("users", []):
        if u.get("email") == req.email:
            return {"error": "User already exists"}
    
    user_id = str(uuid.uuid4())
    db.setdefault("users", []).append({"id": user_id, "email": req.email, "password": req.password})
    save_db(db)
    return {"user": {"id": user_id, "email": req.email}}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    db = load_db()
    for u in db.get("users", []):
        if u.get("email") == req.email and u.get("password") == req.password:
            return {"user": {"id": u["id"], "email": u["email"]}}
    return {"error": "Invalid email or password"}

@app.post("/api/contacts")
async def add_contact(req: ContactRequest):
    db = load_db()
    new_contact = {"id": str(uuid.uuid4()), "userId": req.userId, "name": req.name, "phone": req.phone}
    db.setdefault("contacts", []).append(new_contact)
    save_db(db)
    return {"status": "Contact added", "contact": new_contact}

@app.get("/api/contacts")
async def get_contacts(userId: str):
    db = load_db()
    user_contacts = [c for c in db.get("contacts", []) if c.get("userId") == userId]
    return {"contacts": user_contacts}

@app.post("/api/alerts/send")
async def send_manual_alerts(req: SendAlertsRequest):
    print("Received contacts:", req.contacts)
    # Sends an SMS alert to each target contact manually
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    if not req.contacts:
        print("No contacts provided from frontend. Falling back to TARGET_PHONE_NUMBER.")
        sms_body = f"🚨 SOS! Emergency Protocol 911 Triggered!"
        if TARGET_PHONE_NUMBER:
            send_sms_alert(sms_body, TARGET_PHONE_NUMBER)
    else:
        for contact in req.contacts:
            sms_body = f"🚨 SOS! Emergency Protocol 911 Triggered!"
            phone = contact.get('phone')
            if phone:
                send_sms_alert(sms_body, phone)
                
    return {"status": "Alerts Dispatched"}

@app.post("/alert")
async def handle_alert(alert: AlertRequest):
    is_emergency = check_for_emergency(alert.message) or analyze_sentiment(alert.message) < -0.2
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
        sms_body = f"🚨 SOS! Emergency! Loc: {maps_link}"
        
        db = load_db()
        user_contacts = [c for c in db.get("contacts", []) if c.get("userId") == alert.user_id]
        
        for contact in user_contacts:
            phone = contact.get("phone")
            if phone:
                send_sms_alert(sms_body, phone)
        
        # If no contacts, optionally fallback to TARGET_PHONE_NUMBER
        if not user_contacts and TARGET_PHONE_NUMBER:
            print("No contacts found in db, sending to fallback TARGET_PHONE_NUMBER")
            send_sms_alert(sms_body, TARGET_PHONE_NUMBER)
        
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
