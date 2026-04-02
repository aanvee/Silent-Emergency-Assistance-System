import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(express.json());

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], contacts: [] }, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Auth Endpoints
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email === email);
  
  if (existingUser) return res.status(400).json({ error: 'User already exists' });
  
  const newUser = { id: Date.now().toString(), email, password };
  db.users.push(newUser);
  writeDB(db);
  
  res.json({ user: { id: newUser.id, email: newUser.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  res.json({ user: { id: user.id, email: user.email } });
});

// Contact Endpoints
app.get('/api/contacts', (req, res) => {
  const { userId } = req.query;
  const db = readDB();
  const userContacts = db.contacts.filter((c: any) => c.userId === userId);
  res.json({ contacts: userContacts });
});

app.post('/api/contacts', (req, res) => {
  const { userId, name, phone } = req.body;
  const db = readDB();
  const newContact = { id: Date.now().toString(), userId, name, phone };
  db.contacts.push(newContact);
  writeDB(db);
  res.json({ contact: newContact });
});

// Alert Endpoints
app.post('/api/alerts/send', (req, res) => {
  const { userId, contacts } = req.body;
  console.log(`[ALERT] Sending emergency alerts for User: ${userId}`);
  contacts.forEach((c: any) => {
    console.log(`[SMS SENDING] To: ${c.name} (${c.phone}) - MSG: "SILENT SENTINEL ALERT: User needs immediate assistance! "`);
  });
  
  // Simulate network delay
  setTimeout(() => {
    res.json({ success: true, message: 'Alerts dispatched successfully' });
  }, 1000);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
