# 🚨 Silent Emergency Assistance System

### *“When asking for help isn’t safe.”*

---

## 🧩 Problem

In many dangerous situations (stalking, domestic abuse, public threats),
**victims cannot openly call for help** without escalating the situation.

Existing solutions:

* Require visible interaction 📱
* Are easy to detect ❌
* Lack real-time coordination ⚠️

---

## 💡 Solution

**Silent Emergency Assistance System** is a **covert, intelligent emergency platform** that allows users to:

* Trigger alerts **without raising suspicion**
* Send **real-time location + identity**
* Notify trusted contacts instantly
* Detect danger **automatically using AI**

All hidden behind a **fully functional calculator UI**.

---

## 🕵️ Key Innovation

> A **dual-layer system** combining *stealth interaction* + *intelligent backend detection*

### 🔹 Stealth Layer (Frontend)

* Looks like a normal calculator
* Hidden **double-tap panic trigger**
* No visible emergency UI

### 🔹 Intelligence Layer (Backend)

* Detects distress via:

  * Keywords ("help", "danger")
  * Sentiment analysis (TextBlob)
* Automatically triggers alerts

---

## ⚙️ How It Works

```text
User (Stealth Mode - Calculator)
        ↓
Hidden Trigger / AI Detection
        ↓
Backend Processes Alert
        ↓
Stores + Sends via WebSocket
        ↓
Contacts Receive Alert + Location
```

---

## 🚀 Features

### 🧍 User System

* Secure authentication (email + password)
* Persistent session handling

### 👥 Contact Network

* Add/remove emergency contacts
* Phone-based identification system

### 🕵️ Stealth UI

* Fully functional calculator
* Hidden emergency trigger (double tap)
* Undetectable interface

### 🚨 Emergency Protocol

* Manual alert dispatch
* Auto-trigger after countdown (60s)
* Select contacts or alert all

### 📡 Real-Time Communication

* WebSocket-based alert delivery
* Instant popup alerts for receivers
* Offline fallback logging

### 📍 Live Location Sharing

* GPS-based tracking
* Clickable Google Maps link

### 🧠 AI Detection Engine

* Keyword detection
* Sentiment analysis (negative tone detection)
* Automatic emergency classification

---

## 🏗️ Tech Stack

### 🖥️ Frontend

* React + TypeScript
* Tailwind CSS
* Framer Motion

### ⚙️ Backend

* FastAPI
* SQLAlchemy
* WebSockets
* TextBlob (NLP)

### ☁️ Deployment

* Render (Backend hosting)
* Vite (Frontend build)

---

## 🧪 Technical Highlights

### 🔌 Real-Time Alert System

* Persistent WebSocket connections
* Dynamic user-to-user alert routing
* Handles online/offline states gracefully 

### 🧠 AI-Based Emergency Detection

* Combines:

  * Keyword matching
  * Sentiment polarity scoring
* Reduces false negatives in distress detection 

### 🎯 Stealth Trigger Mechanism

* Double-click detection inside calculator UI
* Zero visual indicators for safety 

---

## 🔄 User Flow

1. User logs in
2. Adds trusted contacts
3. App switches to **calculator mode**
4. Emergency triggered via:

   * Hidden double tap OR
   * Automatic AI detection
5. Backend:

   * Logs alert
   * Sends real-time notifications
6. Contacts receive:

   * 🚨 Alert popup
   * 📍 Live location

---

## ⚙️ Installation

### Backend

```bash
git clone <repo-url>
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Environment Variables

### Backend

```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret
```

### Frontend

```env
VITE_API_BASE=http://localhost:8000
```

---

## 🚀 Deployment

* Hosted on Render
* Supports WebSocket-based real-time alerts
* Requires environment variable configuration

---

## 🧭 Future Scope

* 📱 Mobile App (React Native / Flutter)
* 🔔 Push Notifications
* 🔐 End-to-End Encryption
* 🤖 Advanced ML-based threat prediction
* 🛰️ Offline SMS fallback system

---

## 🌍 Impact

This system can be used in:

* Women safety apps
* Child protection systems
* Military / undercover operations
* Emergency response networks

---

## 🏆 Why This Stands Out

✅ **Stealth-first design** (not just a feature — the core idea)
✅ **AI + real-time system integration**
✅ **Practical, real-world use case**
✅ **Scalable architecture**
✅ **High social impact**

---

## 👩‍💻 Author

Aanvi

---

## ⭐ Final Note

> This isn’t just an app.
> It’s a **silent lifeline** when speaking isn’t an option.

---
