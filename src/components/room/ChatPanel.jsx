import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import Avatar from '../common/Avatar';
import './SidePanel.css';

let typingTimeout;

export default function ChatPanel({ open, onClose, messages, onSend, myName, onTypingChange, typingLabel }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  function handleChange(e) {
    setDraft(e.target.value);
    if (!onTypingChange) return;
    onTypingChange(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => onTypingChange(false), 1500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
    onTypingChange?.(false);
    clearTimeout(typingTimeout);
  }

  return (
    <aside className={`qz-side-panel ${open ? 'qz-side-panel--open' : ''}`} aria-hidden={!open}>
      <div className="qz-side-panel__head">
        <h3>Chat</h3>
        <button onClick={onClose} aria-label="Close chat"><X size={18} /></button>
      </div>

      <div className="qz-chat__list" ref={listRef}>
        {messages.length === 0 && <p className="qz-chat__empty">No messages yet — say hi 👋</p>}
        {messages.map((m) => (
          <div key={m.id} className={`qz-chat__msg ${m.self ? 'qz-chat__msg--self' : ''}`}>
            {!m.self && <Avatar name={m.author} color={m.color} size={30} />}
            <div className="qz-chat__bubble-wrap">
              {!m.self && <span className="qz-chat__author">{m.author}</span>}
              <p className="qz-chat__bubble">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      {typingLabel && <p className="qz-chat__typing">{typingLabel}</p>}

      <form className="qz-chat__composer" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={handleChange}
          placeholder={`Message as ${myName || 'you'}…`}
          maxLength={500}
          aria-label="Type a chat message"
        />
        <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
          <Send size={17} strokeWidth={2.3} />
        </button>
      </form>
    </aside>
  );
}
