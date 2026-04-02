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
  Trash2
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      localStorage.setItem('silent_session', JSON.stringify(data.user));
      onAuthSuccess(data.user);
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

const SetupUI = ({ user, onSetupComplete }: { user: UserSession, onSetupComplete: () => void }) => {
  const [contacts, setContacts] = useState<Omit<Contact, 'id'>[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    if (!name || !phone) return;
    setContacts(prev => [...prev, { name, phone }]);
    setName('');
    setPhone('');
  };

  const handleSave = async () => {
    if (contacts.length === 0) return;
    setLoading(true);
    try {
      for (const contact of contacts) {
        await fetch('/api/contacts', {
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
        <div className="p-8 border-b border-outline-variant/10 bg-surface-container-high/50">
          <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase mb-2">Emergency Hub Setup</h2>
          <p className="text-on-surface-variant text-sm">Synchronize your priority notification circle.</p>
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
                  placeholder="+1 (555) 000-0000"
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
              {contacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/30 italic text-xs">
                  No contacts initialized
                </div>
              ) : (
                contacts.map((c, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="p-4 bg-surface-container-high rounded-xl border border-outline-variant/5 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-bold text-on-surface">{c.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">{c.phone}</div>
                    </div>
                    <button onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))} className="text-error/50 hover:text-error transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-surface-container-high border-t border-outline-variant/10">
          <button 
            onClick={handleSave}
            disabled={contacts.length === 0 || loading}
            className={`w-full py-4 text-xs font-black tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${contacts.length > 0 ? 'bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/10' : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'}`}
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

    try {
      await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contacts: targets }),
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
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          sendAlerts(contacts);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contacts, sendAlerts]);

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

const Calculator = ({ onTrigger }: { onTrigger: () => void }) => {
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

  const fetchContacts = async (userId: string) => {
    try {
      const response = await fetch(`/api/contacts?userId=${userId}`);
      const data = await response.json();
      setContacts(data.contacts);
      if (data.contacts.length === 0) {
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
          <SetupUI user={user} onSetupComplete={() => fetchContacts(user.id)} />
        )}

        {(status === 'STEALTH' || status === 'EMERGENCY') && (
          <>
            <Calculator onTrigger={() => setStatus('EMERGENCY')} />
            {status === 'EMERGENCY' && user && (
              <EmergencyPanel 
                user={user} 
                contacts={contacts} 
                onCancel={() => setStatus('STEALTH')} 
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
