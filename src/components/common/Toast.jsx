import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="qz-toast-stack" aria-live="polite">
        {toasts.map(({ id, message, tone }) => {
          const Icon = ICONS[tone] || ICONS.info;
          return (
            <div key={id} className={`qz-toast qz-toast--${tone}`}>
              <Icon size={17} strokeWidth={2.4} />
              <span>{message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
