import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  EyeOff,
  Lock,
  Settings,
  TriangleAlert,
  UserPlus,
  ChevronRight,
  Mail,
  Phone,
  User,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type AppStatus = 'AUTH' | 'SETUP' | 'STEALTH' | 'EMERGENCY';
interface Contact {
  id: string;
  name: string;
  phone: string;
}
interface UserSession {
  id: string;
  email: string;
}

// --- Components ---
const API_BASE = 'http://127.0.0.1:8000';

const AuthUI = ({ onAuthSuccess }: { onAuthSuccess: (user: UserSession) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      localStorage.setItem('silent_session', JSON.stringify(data));
      onAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel border border-outline-variant/10 p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="text-primary w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2 tracking-widest uppercase">Silent Sentinel</h1>
          <p className="text-on-surface-variant text-sm">Disguised Emergency Protocol Interface</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg py-4 px-12 text-sm focus:border-primary/50 outline-none transition-colors"
                placeholder="sentinel@protocol.id"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Access Cipher</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg py-4 px-12 text-sm focus:border-primary/50 outline-none transition-colors"
                placeholder="********"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-3 bg-error/10 border-l-4 border-error text-error text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary py-4 text-on-primary text-xs font-black tracking-widest uppercase rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Establish Link' : 'Register Protocol')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-on-surface-variant">
          {isLogin ? "No operational record?" : "Already have access?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const SetupUI = ({ user, existingContacts = [], onSetupComplete, onCancel }: { user: UserSession, existingContacts?: Contact[], onSetupComplete: () => void, onCancel?: () => void }) => {
  const [contacts, setContacts] = useState<Omit<Contact, 'id'>[]>([]);
  const [savedContacts, setSavedContacts] = useState<Contact[]>(existingContacts);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteSaved = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/contacts/${id}`, { method: 'DELETE' });
      setSavedContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = () => {
    if (!name || !phone) return;
    setContacts(prev => [...prev, { name, phone }]);
    setName('');
    setPhone('');
  };

  const handleSave = async () => {
    if (contacts.length === 0 && savedContacts.length === 0) return;
    setLoading(true);
    try {
      for (const contact of contacts) {
        await fetch(`${API_BASE}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...contact }),
        });
      }
      onSetupComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-surface-container-low rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10"
      >
        <div className="p-8 border-b border-outline-variant/10 bg-surface-container-high/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase mb-2">Emergency Hub Setup</h2>
            <p className="text-on-surface-variant text-sm">Synchronize your priority notification circle.</p>
          </div>
          <div className="bg-surface-container-highest px-4 py-3 rounded-2xl border border-outline-variant/10 flex items-center justify-between gap-4 group">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70">My Protocol ID</span>
              <span className="text-[11px] font-mono text-on-surface-variant truncate max-w-[140px]">{user.id}</span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(user.id);
                // Simple visual feedback
                const btn = document.getElementById('copy-id-btn');
                if (btn) {
                  btn.innerText = 'COPIED';
                  setTimeout(() => btn.innerText = 'COPY', 2000);
                }
              }}
              id="copy-id-btn"
              className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all active:scale-95 border border-primary/20"
            >
              COPY
            </button>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">New Contact</h3>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl py-3 px-12 text-sm outline-none focus:border-primary/50"
                  placeholder="Contact Name"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl py-3 px-12 text-sm outline-none focus:border-primary/50"
                  placeholder="Target User ID (Raw UUID)"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full py-3 bg-surface-container-highest text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-surface-bright transition-all"
              >
                Add Member
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Protocol Circle</h3>
            <div className="space-y-3 h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {contacts.length === 0 && savedContacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/30 italic text-xs">
                  No contacts initialized
                </div>
              ) : (
                <>
                  {savedContacts.map((c) => (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={c.id}
                      className="p-4 bg-surface-container-high rounded-xl border border-outline-variant/5 flex justify-between items-center opacity-70"
                    >
                      <div>
                        <div className="text-sm font-bold text-on-surface">{c.name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{c.phone}</div>
                      </div>
                      <button onClick={() => handleDeleteSaved(c.id)} className="text-error/50 hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  {contacts.map((c, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`new-${i}`}
                      className="p-4 bg-surface-container-high rounded-xl border border-primary/20 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-sm font-bold text-on-surface">{c.name} <span className="text-[10px] text-primary ml-1">(New)</span></div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{c.phone}</div>
                      </div>
                      <button onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))} className="text-error/50 hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-surface-container-high border-t border-outline-variant/10 flex gap-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-4 text-xs font-black tracking-widest uppercase rounded-xl transition-all border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-highest"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={(contacts.length === 0 && savedContacts.length === 0) || loading}
            className={`flex-1 py-4 text-xs font-black tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${(contacts.length > 0 || savedContacts.length > 0) ? 'bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/10' : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'}`}
          >
            {loading ? 'Initializing...' : 'Save and Deploy System'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const EmergencyPanel = ({ user, contacts, onCancel }: { user: UserSession, contacts: Contact[], onCancel: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  const [alertError, setAlertError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sendAlerts = useCallback(async (targets: Contact[]) => {
    if (status !== 'IDLE') return;
    setStatus('SENDING');
    if (timerRef.current) clearInterval(timerRef.current);

    const getLocation = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
    };

    try {
      console.log("Sending contacts:", targets);
      let latitude = 0.0;
      let longitude = 0.0;
      try {
        const position = await getLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (locErr) {
        console.warn("Location unavailable:", locErr);
      }

      await fetch(`${API_BASE}/api/alerts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contacts: targets, latitude, longitude }),
      });
      setStatus('SENT');
      // Delay before returning to calculator
      setTimeout(() => onCancel(), 3000);
    } catch (err) {
      console.error(err);
      setStatus('IDLE');
    }
  }, [user.id, status, onCancel]);

  useEffect(() => {
    if (status !== 'IDLE') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (timeLeft === 0 && status === 'IDLE') {
      // Forward to ALL contacts when timer runs out, as requested
      sendAlerts(contacts);
    }
  }, [timeLeft, status, contacts, sendAlerts]);

  const handleManualSend = () => {
    if (selectedIds.length === 0) {
      setAlertError('Please select at least one contact to send manually');
      return;
    }
    setAlertError('');
    const targets = contacts.filter(c => selectedIds.includes(c.id));
    sendAlerts(targets);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-lg bg-surface-container-low rounded-3xl border border-error/20 shadow-[0_0_50px_rgba(255,0,0,0.1)] overflow-hidden"
      >
        <div className="p-6 bg-error/10 border-b border-error/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error text-on-error rounded-lg">
              <TriangleAlert className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-error tracking-widest">Protocol Active</h3>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Automatic Trigger in {timeLeft}s</p>
            </div>
          </div>
          <div className="text-2xl font-mono text-error font-black">{timeLeft}s</div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
            Select the contacts you wish to alert immediately. If no selection is made before the timer runs out, ALL members will be notified automatically.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {contacts.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedIds.includes(c.id) ? 'bg-primary/10 border-primary' : 'bg-surface-container-high border-outline-variant/10 hover:border-primary/30'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.includes(c.id) ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant/30'}`}>
                    {selectedIds.includes(c.id) && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-on-surface uppercase tracking-widest">{c.name}</div>
                    <div className="text-xs font-mono text-on-surface-variant">{c.phone}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 flex flex-col gap-3">
          <AnimatePresence>
            {alertError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="text-error text-center text-[10px] font-bold uppercase tracking-widest animate-pulse"
              >
                {alertError}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            disabled={status !== 'IDLE'}
            onClick={handleManualSend}
            className="w-full py-4 bg-error text-on-error text-xs font-black tracking-widest uppercase rounded-2xl shadow-lg shadow-error/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {status === 'SENDING' ? 'Dispatched Terminal...' : status === 'SENT' ? 'Alerts Confirmed' : 'Send Immediate Alert'}
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            disabled={status !== 'IDLE'}
            className="w-full py-3 text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em] hover:text-on-surface transition-colors"
          >
            Standby / Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const IncomingAlertModal = ({ alertData, onDismiss }: { alertData: any, onDismiss: () => void }) => {
  useEffect(() => {
    // Attempt to play an alert sound
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.wav');
    audio.play().catch(e => console.log('Audio playback prevented by browser policy', e));

    const intervalId = setInterval(() => {
       audio.play().catch(e => {});
    }, 1500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-error/90 backdrop-blur-md">
       <div className="absolute inset-0 bg-error animate-pulse mix-blend-overlay"></div>
       <div className="bg-surface-container-low w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10 border border-error/50">
          <h1 className="text-3xl font-black text-error text-center uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">🚨 EMERGENCY ALERT</h1>
          
          <div className="space-y-6 mb-8 bg-surface-container px-6 py-6 rounded-2xl border border-outline-variant/10">
             <div>
               <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">From / Target ID:</span> <br/>
               <span className="text-on-surface text-lg font-mono">{alertData.sender_name} <br/><span className="text-xs opacity-50">{alertData.from}</span></span>
             </div>
             <div>
               <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Priority Message:</span> <br/>
               <span className="text-error font-black text-xl uppercase tracking-tighter">{alertData.message}</span>
             </div>
             
             {alertData.location && (
               <div>
                  <a href={`https://maps.google.com/?q=${alertData.location.lat},${alertData.location.lng}`} target="_blank" rel="noreferrer" className="block text-center w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 text-xs">
                    View Live Coordinates
                  </a>
               </div>
             )}
          </div>

          <button onClick={onDismiss} className="w-full py-4 bg-surface-container-highest text-on-surface-variant text-xs uppercase font-black tracking-widest rounded-xl hover:text-on-surface focus:outline-none transition-all">
            Understood / Dismiss
          </button>
       </div>
    </div>
  );
};

const Calculator = ({ onTrigger, onManageContacts }: { onTrigger: () => void, onManageContacts: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleAction = useCallback((label: string) => {
    if (label === 'C') {
      setDisplay('0');
      setEquation('');
      setShouldResetDisplay(false);
      return;
    }

    if (label === '=') {
      // STRICT TRIGGER CONDITION
      if (equation === '' && display === '911') {
        onTrigger();
        setDisplay('0');
        return;
      }

      if (!equation) return;

      try {
        const finalEquation = equation + display;
        const cleanEquation = finalEquation.replace(/×/g, '*').replace(/÷/g, '/');
        const result = eval(cleanEquation);
        setDisplay(String(result));
        setEquation('');
        setShouldResetDisplay(true);
      } catch (e) {
        setDisplay('Error');
        setShouldResetDisplay(true);
      }
      return;
    }

    if (['+', '-', '×', '÷'].includes(label)) {
      if (shouldResetDisplay && equation) {
        setEquation(equation.slice(0, -1) + label);
      } else {
        setEquation(display + label);
        setShouldResetDisplay(true);
      }
      return;
    }

    if (label === 'Backspace') {
      if (shouldResetDisplay) return;
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }

    if (label === '+/-') {
      setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
      return;
    }

    if (label === '%') {
      setDisplay(prev => String(Number(prev) / 100));
      return;
    }

    if (shouldResetDisplay) {
      setDisplay(label === '.' ? '0.' : label);
      setShouldResetDisplay(false);
    } else {
      if (label === '.') {
        if (!display.includes('.')) setDisplay(prev => prev + '.');
      } else {
        setDisplay(prev => (prev === '0' && label !== '0') ? label : (prev === '0' && label === '0' ? '0' : prev + label));
      }
    }
  }, [display, equation, shouldResetDisplay, onTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '=', 'Enter', 'Backspace', 'Escape', 'c', 'C'];
      if (!allowedKeys.includes(e.key)) return;
      e.preventDefault();
      if (e.key >= '0' && e.key <= '9') handleAction(e.key);
      else if (e.key === '.') handleAction('.');
      else if (e.key === '+') handleAction('+');
      else if (e.key === '-') handleAction('-');
      else if (e.key === '*') handleAction('×');
      else if (e.key === '/') handleAction('÷');
      else if (e.key === 'Enter' || e.key === '=') handleAction('=');
      else if (e.key === 'Backspace') handleAction('Backspace');
      else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') handleAction('C');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  const buttons = [
    { label: 'C', color: 'text-secondary' },
    { label: '+/-', color: 'text-secondary' },
    { label: '%', color: 'text-secondary' },
    { label: '÷', color: 'text-secondary', variant: 'highest' },
    { label: '7' }, { label: '8' }, { label: '9' },
    { label: '×', color: 'text-secondary', variant: 'highest' },
    { label: '4' }, { label: '5' }, { label: '6' },
    { label: '-', color: 'text-secondary', variant: 'highest' },
    { label: '1' }, { label: '2' }, { label: '3' },
    { label: '+', color: 'text-secondary', variant: 'highest' },
    { label: '0', colSpan: 2 },
    { label: '.' },
    { label: '=', color: 'bg-secondary text-on-secondary font-bold' }
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-container-low rounded-[2rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-outline-variant/5"
      >
        <div className="h-64 flex flex-col justify-end items-end p-8 bg-black/40 relative">
          <div className="absolute top-4 left-6 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <button onClick={onManageContacts} className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer z-10" title="Manage Contacts">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-4 right-6 flex items-center gap-2 opacity-20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Protocol V.911</span>
          </div>
          <div className="text-on-surface-variant text-sm font-mono tracking-wider opacity-60 mb-2 truncate max-w-full">
            {equation} {shouldResetDisplay ? '' : ''}
          </div>
          <div className="text-7xl font-light text-on-surface tracking-tighter transition-all">
            {display}
          </div>
        </div>
        <div className="grid grid-cols-4 bg-surface-container-high/30">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={() => handleAction(btn.label)}
              className={`
                h-24 flex items-center justify-center text-xl transition-all active:scale-95
                ${btn.colSpan ? 'col-span-2' : ''}
                ${btn.variant === 'highest' ? 'bg-surface-container-highest' : btn.color?.startsWith('bg-') ? btn.color : 'bg-surface-container-high'}
                ${!btn.color?.startsWith('bg-') ? (btn.color || 'text-on-surface font-medium') : ''}
                hover:brightness-125 border border-outline-variant/5
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [status, setStatus] = useState<AppStatus>('AUTH');
  const [user, setUser] = useState<UserSession | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingAlert, setIncomingAlert] = useState<any>(null);

  // WebSocket Connection for Real-Time Receiver Mode
  useEffect(() => {
    if (!user || status === 'AUTH' || status === 'SETUP') return;

    const wsUrl = `ws://127.0.0.1:8000/ws/${user.id}`;
    let ws: WebSocket;
    
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => console.log('📡 Connected to Emergency Network');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'EMERGENCY_ALERT') {
             console.log("🚨 INCOMING ALERT", data);
             setIncomingAlert(data);
          }
        } catch (err) {
          console.error("Failed to parse incoming alert", err);
        }
      };
      ws.onclose = () => console.log('📡 Disconnected from network');
    } catch (e) {
      console.warn('Real-time connection failed', e);
    }

    return () => {
       if (ws) ws.close();
    };
  }, [user, status]);

  const fetchContacts = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/contacts?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to load contacts');
      }

      // Backend returns raw array [] or [{...}, ...]
      const contactList = Array.isArray(data) ? data : (data.contacts || []);
      console.log("Loaded contacts:", contactList);
      setContacts(contactList);
      
      if (contactList.length === 0) {
        setStatus('SETUP');
      } else {
        setStatus('STEALTH');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('silent_session');
    if (session) {
      const parsedUser = JSON.parse(session);
      setUser(parsedUser);
      fetchContacts(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-lg shadow-primary/20"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-on-surface font-sans selection:bg-primary/20">
      <AnimatePresence mode="wait">
        {status === 'AUTH' && (
          <AuthUI onAuthSuccess={(u) => {
            setUser(u);
            fetchContacts(u.id);
          }} />
        )}

        {status === 'SETUP' && user && (
          <SetupUI
            user={user}
            existingContacts={contacts}
            onSetupComplete={() => fetchContacts(user.id)}
            onCancel={contacts.length > 0 ? () => setStatus('STEALTH') : undefined}
          />
        )}

        {(status === 'STEALTH' || status === 'EMERGENCY') && (
          <>
            <Calculator onTrigger={() => setStatus('EMERGENCY')} onManageContacts={() => setStatus('SETUP')} />
            {status === 'EMERGENCY' && user && (
              <EmergencyPanel
                user={user}
                contacts={contacts}
                onCancel={() => setStatus('STEALTH')}
              />
            )}
            
            <AnimatePresence>
              {incomingAlert && (
                 <IncomingAlertModal alertData={incomingAlert} onDismiss={() => setIncomingAlert(null)} />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
