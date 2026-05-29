import { C, sans } from "../tokens.js";

export function Btn({ children, onClick, variant = "primary", disabled = false, small = false, style: extra = {} }) {
  const base = {
    fontFamily: sans,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    borderRadius: 8,
    transition: "background 0.15s, opacity 0.15s",
    padding: small ? "0.5rem 1rem" : "0.75rem 1.5rem",
    fontSize: small ? "0.82rem" : "0.92rem",
    opacity: disabled ? 0.5 : 1,
    ...extra,
  };
  const variants = {
    primary: { background: C.green, color: "#fff" },
    ghost: { background: "none", border: `1px solid ${C.border}`, color: C.soft },
    danger: { background: "none", border: "none", color: C.muted },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Field({ label, value, onChange, placeholder, multiline = false }) {
  const common = {
    width: "100%",
    boxSizing: "border-box",
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    padding: "0.55rem 0.75rem",
    fontSize: "0.9rem",
    fontFamily: sans,
    outline: "none",
    background: C.surface,
    color: C.text,
  };
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, marginBottom: "0.25rem" }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ ...common, resize: "vertical", lineHeight: 1.5 }}
          onFocus={e => (e.target.style.borderColor = C.green)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={common}
          onFocus={e => (e.target.style.borderColor = C.green)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      )}
    </label>
  );
}
