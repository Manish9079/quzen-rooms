import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ open, onClose, title, children, width = 460 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="qz-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qz-modal qz-glass" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="qz-modal__header">
          <h3>{title}</h3>
          <button className="qz-modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={19} strokeWidth={2.25} />
          </button>
        </div>
        <div className="qz-modal__body">{children}</div>
      </div>
    </div>
  );
}
