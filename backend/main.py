from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from textblob import TextBlob
from dotenv import load_dotenv

import models, schemas, crud
from database import SessionLocal, engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

load_dotenv(override=True)

app = FastAPI()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.active_connections[user_id] = ws
        print(f"User {user_id} connected via WS. Active: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected via WS.")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            ws = self.active_connections[user_id]
            try:
                await ws.send_json(message)
                print(f"WS payload sent to {user_id}")
            except Exception as e:
                print(f"WS send error for {user_id}: {e}")
                self.disconnect(user_id)
        else:
            print(f"Simulated alert sent (Contact {user_id} offline)")

manager = ConnectionManager()

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Utilities ---
def check_for_emergency(message: str) -> bool:
    emergency_keywords = ["help", "danger", "emergency", "save me", "scared", "unsafe", "afraid", "threat", "panic"]
    message_lower = message.lower()
    if "cry" in message_lower: return True
    return any(keyword in message_lower for keyword in emergency_keywords)

def analyze_sentiment(message: str) -> float:
    analysis = TextBlob(message)
    return analysis.sentiment.polarity


# --- Endpoints ---
@app.get("/")
async def root():
    return {"message": "Backend running"}

@app.post("/api/auth/signup", response_model=schemas.UserResponse)
async def signup(req: schemas.AuthRequest, db: Session = Depends(get_db)):
    db_user_email = crud.get_user_by_email(db, email=req.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if req.phone:
        db_user_phone = crud.get_user_by_phone(db, phone=req.phone)
        if db_user_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    return crud.create_user(db=db, req=req)

@app.post("/api/auth/login", response_model=schemas.UserResponse)
async def login(req: schemas.AuthRequest, db: Session = Depends(get_db)):
    db_user = crud.authenticate_user(db, req=req)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return db_user

@app.post("/api/contacts", response_model=schemas.ContactResponse)
async def add_contact(req: schemas.ContactRequest, db: Session = Depends(get_db)):
    return crud.create_contact(db=db, req=req)

@app.get("/api/contacts", response_model=list[schemas.ContactResponse])
async def get_contacts(userId: str, db: Session = Depends(get_db)):
    contacts = crud.get_contacts_by_user(db, user_id=userId)
    return contacts

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str, db: Session = Depends(get_db)):
    success = crud.delete_contact(db, contact_id=contact_id)
    if success:
        return {"status": "Contact deleted"}
    raise HTTPException(status_code=404, detail="Contact not found")

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/api/alerts")
async def get_alerts(userId: str, db: Session = Depends(get_db)):
    alerts = crud.get_alerts_by_receiver(db, receiver_id=userId)
    return alerts

@app.post("/api/alerts/send")
async def send_manual_alerts(req: schemas.SendAlertsRequest, db: Session = Depends(get_db)):
    print(f"Alert Triggered by {req.userId}. Targets: {len(req.contacts)}")
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    if req.contacts:
        for contact in req.contacts:
            # The contact object from frontend has 'phone'
            target_id = contact.get('phone')
            if not target_id: continue

            # Try to resolve phone number to User ID for WebSocket delivery
            # If target_id is already a UUID (with hyphens), we keep it
            recipient_user_id = target_id
            if "-" not in target_id and len(target_id) >= 10:
                target_user = crud.get_user_by_phone(db, phone=target_id)
                if target_user:
                    recipient_user_id = target_user.id
                else:
                    print(f"⚠️ Warning: No registered user found for phone {target_id}. Alert will be logged but WebSocket delivery may fail.")

            # Look up sender info for payload
            sender_user = db.query(models.User).filter(models.User.id == req.userId).first()
            sender_name = sender_user.name if sender_user else "Protocol Member"
            sender_phone = sender_user.phone if sender_user else "N/A"

            # 1. Log the alert in DB (so it can be polled)
            crud.create_alert(db, req.userId, recipient_user_id, "EMERGENCY PROTOCOL ACTIVATED.", req.latitude, req.longitude, timestamp)
            
            # 2. Attempt Real-time delivery
            alert_payload = {
                "type": "EMERGENCY_ALERT",
                "from": sender_phone,
                "sender_name": sender_name,
                "location": {"lat": req.latitude, "lng": req.longitude},
                "message": "EMERGENCY PROTOCOL ACTIVATED.",
                "timestamp": timestamp
            }
            await manager.send_personal_message(alert_payload, recipient_user_id)
                
    return {"status": "Alerts Dispatched"}

@app.post("/alert")
async def handle_alert(alert: schemas.AlertRequest, db: Session = Depends(get_db)):
    has_keywords = check_for_emergency(alert.message)
    sentiment_score = analyze_sentiment(alert.message)
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
        
        # Push via Websocket
        user_contacts = crud.get_contacts_by_user(db, user_id=alert.user_id)
        
        for contact in user_contacts:
            target_id = contact.phone
            if not target_id: continue

            # Try to resolve phone number to User ID for WebSocket delivery
            recipient_user_id = target_id
            if "-" not in target_id and len(target_id) >= 10:
                target_user = crud.get_user_by_phone(db, phone=target_id)
                if target_user:
                    recipient_user_id = target_user.id
                else:
                    print(f"⚠️ Warning: No registered user found for phone {target_id}. Alert will be logged but WebSocket delivery may fail.")

            # Look up sender info for payload
            sender_user = db.query(models.User).filter(models.User.id == alert.user_id).first()
            sender_name = sender_user.name if sender_user else "Protocol Member"
            sender_phone = sender_user.phone if sender_user else "N/A"

            # 1. Log the alert in DB
            crud.create_alert(db, alert.user_id, recipient_user_id, alert.message, alert.latitude, alert.longitude, timestamp)
            
            # 2. Attempt Real-time delivery
            alert_payload = {
                "type": "EMERGENCY_ALERT",
                "from": sender_phone,
                "sender_name": sender_name,
                "location": {"lat": alert.latitude, "lng": alert.longitude},
                "message": alert.message,
                "timestamp": timestamp
            }
            await manager.send_personal_message(alert_payload, recipient_user_id)
        
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
