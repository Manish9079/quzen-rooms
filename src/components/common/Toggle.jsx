import './Toggle.css';

export default function Toggle({ checked, onChange, label, description, id }) {
  const inputId = id || `toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="qz-toggle-row">
      {(label || description) && (
        <div className="qz-toggle-row__text">
          {label && <label htmlFor={inputId} className="qz-toggle-row__label">{label}</label>}
          {description && <p className="qz-toggle-row__desc">{description}</p>}
        </div>
      )}
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`qz-toggle ${checked ? 'qz-toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="qz-toggle__thumb" />
      </button>
    </div>
  );
}
