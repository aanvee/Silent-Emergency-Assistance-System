from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

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

def check_for_emergency(message: str) -> bool:
    """Simple keyword-based AI detection function."""
    emergency_keywords = ["help", "danger", "emergency", "save me"]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in emergency_keywords)

@app.get("/")
async def root():
    return {"message": "Backend running"}

@app.post("/alert")
async def handle_alert(alert: AlertRequest):
    is_emergency = check_for_emergency(alert.message)
    
    if is_emergency:
        # Print alert details in terminal
        print("\n" + "="*40)
        print("!!! EMERGENCY ALERT DETECTED !!!")
        print("="*40)
        print(f"User ID  : {alert.user_id}")
        print(f"Location : Lat: {alert.latitude}, Lng: {alert.longitude}")
        print(f"Message  : {alert.message}")
        print("="*40 + "\n")
        
        return {
            "status": "Alert sent",
            "data": alert.dict()
        }
    else:
        return {"status": "No emergency detected"}
