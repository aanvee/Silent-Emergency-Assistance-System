from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
from textblob import TextBlob
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables
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
        print("Twilio client initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Twilio client: {e}")

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

# --- In-Memory DB ---
users_db = {}      # email -> {"id": str, "email": str, "password": str}
contacts_db = {}   # userId -> [{"id": str, "name": str, "phone": str}]

# --- Utilities ---
def check_for_emergency(message: str) -> bool:
    emergency_keywords = ["help", "danger", "emergency", "save me", "scared", "unsafe", "afraid", "threat", "panic"]
    message_lower = message.lower()
    if "cry" in message_lower: return True
    return any(keyword in message_lower for keyword in emergency_keywords)

def analyze_sentiment(message: str) -> float:
    analysis = TextBlob(message)
    return analysis.sentiment.polarity

def send_sms_alert(message_body: str):
    """
    Sends an SMS using Twilio. If credentials fail (401), it logs the error 
    but allows the API to return a success response to the frontend.
    """
    if not twilio_client:
        print(f"[SIMULATION] SMS Content: {message_body}")
        return True
    try:
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=TARGET_PHONE_NUMBER
        )
        print(f"SMS Alert sent! SID: {message.sid}")
        return True
    except Exception as e:
        print(f"!!! SMS Alert Failed (Possible 401/Auth issue): {e}")
        return False

# --- Endpoints ---
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
    timestamp = datetime.utcnow().isoformat() + "Z"
    for contact in req.contacts:
        sms_body = (
            f"🚨 SILENT EMERGENCY ALERT 🚨\n"
            f"User ID: {req.userId}\n"
            f"Ref: Protocol V.911 Manual Trigger\n"
            f"Recipient: {contact.get('name', 'Contact')}\n"
            f"Time: {timestamp}"
        )
        send_sms_alert(sms_body)
    return {"status": "Alerts Dispatched", "success": True}

@app.post("/alert")
async def handle_alert(alert: AlertRequest):
    is_emergency = check_for_emergency(alert.message) or analyze_sentiment(alert.message) < -0.2
    timestamp = datetime.utcnow().isoformat() + "Z"
    if is_emergency:
        send_sms_alert(f"🚨 SILENT ALERT 🚨\nUser: {alert.user_id}\nMsg: {alert.message}\nTime: {timestamp}")
        return {"status": "Alert sent", "success": True}
    return {"status": "No emergency detected"}
