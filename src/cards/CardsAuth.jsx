import { useState } from "react";
import { C, serif, sans } from "../tokens.js";
import { supabase } from "../lib/supabase.js";
import { Btn } from "./ui.jsx";

const wrapStyle = { minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: "2rem" };
const fieldStyle = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
  borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans,
  outline: "none", background: C.bg, color: C.text,
};

// Shown after the user follows a password-reset link (PASSWORD_RECOVERY).
// On success Supabase already has a session, so CardsApp takes over.
export function SetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <div style={wrapStyle}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: serif, fontSize: "2.5rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>Glōssa</div>
          <div style={{ fontSize: "0.8rem", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Choose a new password</div>
        </div>
        <form onSubmit={handleSubmit} style={{ background: C.surface, borderRadius: 16, padding: "2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          {error && (
            <div style={{ background: C.wrongLight, border: `1px solid #E0AAAA`, borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem", color: C.wrong, marginBottom: "1.25rem", lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              style={fieldStyle}
              onFocus={e => (e.target.style.borderColor = C.green)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>
          <Btn disabled={busy} style={{ width: "100%" }}>{busy ? "…" : "Update password"}</Btn>
        </form>
      </div>
    </div>
  );
}

// Email + password gate for Glossa Cards only. The main learning app stays
// anonymous; an account here ties a vocab deck to the user across devices.
export default function CardsAuth() {
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setNotice("Check your email to confirm your account, then sign in.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/flashcards",
      });
      if (error) setError(error.message);
      else setNotice("If that email has an account, a password reset link is on its way.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      // on success the onAuthStateChange listener in CardsApp takes over
    }
    setBusy(false);
  }

  const title =
    mode === "signin" ? "Sign in to your deck"
    : mode === "signup" ? "Create an account"
    : "Reset your password";

  const submitLabel =
    mode === "signin" ? "Sign in"
    : mode === "signup" ? "Sign up"
    : "Send reset link";

  const inputStyle = {
    width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
    borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans,
    outline: "none", background: C.bg, color: C.text,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: serif, fontSize: "2.5rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em" }}>Glōssa</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.amber }}>Cards</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
            {title}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.surface, borderRadius: 16, padding: "2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>

          {notice && (
            <div style={{ background: C.greenLight, border: `1px solid #B0CEBC`, borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem", color: C.green, marginBottom: "1.25rem", lineHeight: 1.5 }}>
              {notice}
            </div>
          )}

          {error && (
            <div style={{ background: C.wrongLight, border: `1px solid #E0AAAA`, borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem", color: C.wrong, marginBottom: "1.25rem", lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = C.green)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {mode !== "reset" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = C.green)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              {mode === "signin" && (
                <div style={{ textAlign: "right", marginTop: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setError(null); setNotice(null); }}
                    style={{ background: "none", border: "none", color: C.soft, textDecoration: "underline", cursor: "pointer", fontFamily: sans, fontSize: "0.78rem" }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <Btn disabled={busy} style={{ width: "100%" }}>
            {busy ? "…" : submitLabel}
          </Btn>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            {mode === "reset" ? (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); setNotice(null); }}
                style={{ background: "none", border: "none", color: C.green, textDecoration: "underline", cursor: "pointer", fontFamily: sans, fontSize: "0.85rem" }}
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
                style={{ background: "none", border: "none", color: C.green, textDecoration: "underline", cursor: "pointer", fontFamily: sans, fontSize: "0.85rem" }}
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
