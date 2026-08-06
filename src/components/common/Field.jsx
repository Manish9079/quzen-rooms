import './Field.css';

export function Field({ label, hint, error, children, id, required }) {
  return (
    <div className="qz-field">
      {label && (
        <label htmlFor={id} className="qz-field__label">
          {label}{required && <span className="qz-field__req"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="qz-field__hint">{hint}</p>}
      {error && <p className="qz-field__error">{error}</p>}
    </div>
  );
}

export function TextInput({ id, icon: Icon, className = '', ...props }) {
  return (
    <div className={`qz-input ${Icon ? 'qz-input--icon' : ''} ${className}`}>
      {Icon && <Icon size={18} className="qz-input__icon" strokeWidth={2} />}
      <input id={id} {...props} />
    </div>
  );
}

export function Select({ id, children, className = '', ...props }) {
  return (
    <div className={`qz-input qz-input--select ${className}`}>
      <select id={id} {...props}>{children}</select>
    </div>
  );
}

export function TextArea({ id, className = '', ...props }) {
  return (
    <div className={`qz-input qz-input--textarea ${className}`}>
      <textarea id={id} {...props} />
    </div>
  );
}
