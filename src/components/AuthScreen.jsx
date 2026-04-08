import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const C = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  soft: "#6E6760",
  muted: "#A8A09A",
  green: "#2B5F47",
  greenLight: "#EAF0EC",
  border: "#DDD6CB",
  wrong: "#B04040",
  wrongLight: "#FAEAEA",
};
const serif = "'Lora', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } });
      if (error) {
        setError(error.message);
      } else {
        setNotice("Check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      // on success the onAuthStateChange listener in App.jsx takes over
    }

    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: serif, fontSize: "2.75rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em", marginBottom: "0.35rem" }}>
            Glōssa
          </div>
          <div style={{ fontSize: "0.8rem", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
            {mode === "signin" ? "Sign in to continue" : "Create an account"}
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

          {mode === "signup" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoFocus
                  style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans, outline: "none", background: C.bg, color: C.text }}
                  onFocus={e => (e.target.style.borderColor = C.green)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans, outline: "none", background: C.bg, color: C.text }}
                  onFocus={e => (e.target.style.borderColor = C.green)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={mode === "signin"}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans, outline: "none", background: C.bg, color: C.text }}
              onFocus={e => (e.target.style.borderColor = C.green)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: C.soft, marginBottom: "0.4rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.95rem", fontFamily: sans, outline: "none", background: C.bg, color: C.text }}
              onFocus={e => (e.target.style.borderColor = C.green)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            style={{ width: "100%", background: busy ? C.muted : C.green, color: "#fff", border: "none", borderRadius: 8, padding: "0.8rem", fontSize: "0.95rem", fontFamily: sans, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", transition: "background 0.15s" }}
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <button
              type="button"
              onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
              style={{ background: "none", border: "none", color: C.soft, fontSize: "0.82rem", cursor: "pointer", fontFamily: sans, textDecoration: "underline" }}
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
