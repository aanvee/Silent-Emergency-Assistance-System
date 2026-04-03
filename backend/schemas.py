from pydantic import BaseModel
from typing import List, Optional

class AuthRequest(BaseModel):
    name: Optional[str] = None
    email: str
    phone: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: Optional[str] = None
    email: str
    phone: str

    class Config:
        from_attributes = True

class ContactRequest(BaseModel):
    userId: str
    name: str
    phone: str

class ContactResponse(BaseModel):
    id: str
    userId: str
    name: str
    phone: str
    
    class Config:
        from_attributes = True

class SendAlertsRequest(BaseModel):
    userId: str
    contacts: list
    latitude: float = 0.0
    longitude: float = 0.0

class AlertRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    message: str
