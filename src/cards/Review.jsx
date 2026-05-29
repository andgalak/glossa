import { useState } from "react";
import { C, serif, sans } from "../tokens.js";
import { Btn } from "./ui.jsx";
import { sm2 } from "../lib/sm2.js";
import { updateCard } from "./cards.js";

function getDueCards(cards) {
  const now = new Date();
  const due = cards.filter(c => !c.retired && new Date(c.due_date) <= now);
  if (due.length > 0) return due;
  const active = cards.filter(c => !c.retired);
  if (active.length === 0) return [];
  return [active.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]];
}

const RATINGS = [
  { label: "Hard", rating: 1, primary: false },
  { label: "Medium", rating: 3, primary: false },
  { label: "Easy", rating: 4, primary: true },
];

export default function Review({ cards, setCards, onDone }) {
  const [dir, setDir] = useState("en2gr"); // en2gr (default) | gr2en
  const [queue] = useState(() => getDueCards(cards));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const active = cards.filter(c => !c.retired);

  function rate(card, rating) {
    const updates = sm2(card, rating);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...updates } : c));
    updateCard(card.id, updates);
    setIdx(i => i + 1);
    setFlipped(false);
  }

  if (active.length === 0) {
    return (
      <Empty title="Nothing to review" body="Add some words, then come back to study them." onDone={onDone} />
    );
  }

  if (idx >= queue.length) {
    return (
      <Empty title="All caught up!" body="No more cards due right now. Come back later." onDone={onDone} />
    );
  }

  const card = queue[idx];
  const front = dir === "en2gr" ? card.english : card.greek;
  const back = dir === "en2gr" ? card.greek : card.english;
  const examplePrimary = card.example_greek;
  const exampleSecondary = card.example_translation;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <button
          onClick={() => setDir(d => d === "en2gr" ? "gr2en" : "en2gr")}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "0.35rem 0.75rem", fontSize: "0.75rem", color: C.soft, cursor: "pointer", fontFamily: sans }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.green)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
        >
          {dir === "en2gr" ? "English → Greek" : "Greek → English"}
        </button>
        <span style={{ color: C.muted, fontSize: "0.82rem" }}>{idx + 1} / {queue.length}</span>
      </div>

      <div
        onClick={() => setFlipped(v => !v)}
        style={{
          background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16,
          padding: "3.25rem 2rem", textAlign: "center", cursor: "pointer", minHeight: 200,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: "1.5rem", userSelect: "none",
        }}
      >
        {!flipped ? (
          <div style={{ fontFamily: serif, fontSize: "2rem" }}>{front || "—"}</div>
        ) : (
          <>
            <div style={{ fontFamily: serif, fontSize: "1.6rem", fontWeight: 600, marginBottom: "1rem" }}>{back || "—"}</div>
            {examplePrimary && (
              <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{examplePrimary}</div>
            )}
            {exampleSecondary && (
              <div style={{ fontSize: "0.82rem", color: C.soft, fontStyle: "italic", lineHeight: 1.55, marginTop: "0.25rem" }}>{exampleSecondary}</div>
            )}
            {card.notes && (
              <div style={{ fontSize: "0.75rem", color: C.amber, marginTop: "0.75rem", lineHeight: 1.5 }}>{card.notes}</div>
            )}
          </>
        )}
      </div>

      {!flipped ? (
        <div style={{ textAlign: "center", color: C.muted, fontSize: "0.8rem" }}>Tap the card to reveal</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {RATINGS.map(({ label, rating, primary }) => (
              <button
                key={label}
                onClick={() => rate(card, rating)}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: 8,
                  border: `1.5px solid ${primary ? C.green : C.border}`,
                  background: primary ? C.green : C.surface, color: primary ? "#fff" : C.text,
                  fontFamily: sans, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => rate(card, 5)}
            style={{ width: "100%", padding: "0.55rem", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontFamily: sans, fontSize: "0.78rem", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.color = C.soft)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
          >
            Too easy — don't show again
          </button>
        </div>
      )}
    </div>
  );
}

function Empty({ title, body, onDone }) {
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: serif, fontSize: "1.4rem", color: C.green, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>{body}</div>
      <Btn variant="ghost" onClick={onDone}>Back to deck</Btn>
    </div>
  );
}
