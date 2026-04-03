from sqlalchemy.orm import Session
import models, schemas
import uuid

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_phone(db: Session, phone: str):
    return db.query(models.User).filter(models.User.phone == phone).first()

def authenticate_user(db: Session, req: schemas.AuthRequest):
    return db.query(models.User).filter(
        models.User.name == req.name,
        models.User.email == req.email, 
        models.User.phone == req.phone, 
        models.User.password == req.password
    ).first()

def create_user(db: Session, req: schemas.AuthRequest):
    db_user = models.User(name=req.name, email=req.email, phone=req.phone, password=req.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_contacts_by_user(db: Session, user_id: str):
    return db.query(models.Contact).filter(models.Contact.userId == user_id).all()

def create_contact(db: Session, req: schemas.ContactRequest):
    db_contact = models.Contact(userId=req.userId, name=req.name, phone=req.phone)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def delete_contact(db: Session, contact_id: str):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if db_contact:
        db.delete(db_contact)
        db.commit()
        return True
    return False

def create_alert(db: Session, sender_id: str, receiver_id: str, message: str, lat: float, lng: float, timestamp: str):
    db_alert = models.Alert(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message,
        latitude=lat,
        longitude=lng,
        timestamp=timestamp
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts_by_receiver(db: Session, receiver_id: str):
    return db.query(models.Alert).filter(models.Alert.receiver_id == receiver_id).all()

def delete_alerts_by_receiver(db: Session, receiver_id: str):
    db.query(models.Alert).filter(models.Alert.receiver_id == receiver_id).delete()
    db.commit()
