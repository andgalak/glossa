import { useState } from "react";
import { C, serif, sans } from "../tokens.js";
import { Btn } from "./ui.jsx";
import { sm2 } from "../lib/sm2.js";
import { updateCard } from "./cards.js";

const BATCH_SIZE = 10;

// Cards due now, hardest / most-overdue first, capped to one batch.
// SM-2 handles long-term spacing (easy cards get longer intervals, so they
// come due far less often); this just orders and caps a single session.
function dueBatch(cards) {
  const now = new Date();
  return cards
    .filter(c => !c.retired && new Date(c.due_date) <= now)
    .sort((a, b) => {
      const d = new Date(a.due_date) - new Date(b.due_date);
      if (d !== 0) return d; // most overdue first
      return (a.ease_factor ?? 2.5) - (b.ease_factor ?? 2.5); // then hardest
    })
    .slice(0, BATCH_SIZE);
}

function dueCount(cards) {
  const now = new Date();
  return cards.filter(c => !c.retired && new Date(c.due_date) <= now).length;
}

const RATINGS = [
  { label: "Hard", rating: 1, primary: false },
  { label: "Medium", rating: 3, primary: false },
  { label: "Easy", rating: 4, primary: true },
];

export default function Review({ cards, setCards, onDone }) {
  const [dir, setDir] = useState("en2gr"); // en2gr (default) | gr2en
  const [queue, setQueue] = useState(() => dueBatch(cards));
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

  function nextBatch() {
    setQueue(dueBatch(cards));
    setIdx(0);
    setFlipped(false);
  }

  if (active.length === 0) {
    return (
      <Empty title="Nothing to review" body="Add some words, then come back to study them." onDone={onDone} />
    );
  }

  if (idx >= queue.length) {
    // The just-rated cards now have future due dates, so `cards` reflects what is left.
    const remaining = dueCount(cards);
    if (remaining > 0) {
      return (
        <Empty
          title="Batch done!"
          body={`${remaining} card${remaining === 1 ? "" : "s"} still due today.`}
          onDone={onDone}
          action={{ label: `Next ${Math.min(BATCH_SIZE, remaining)}`, onClick: nextBatch }}
        />
      );
    }
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
    <div style={{
      width: "100%", maxWidth: 560, margin: "0 auto", padding: "1.25rem 1.25rem 1.5rem",
      flex: 1, boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexShrink: 0 }}>
        <button
          onClick={() => setDir(d => d === "en2gr" ? "gr2en" : "en2gr")}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "0.45rem 0.8rem", fontSize: "0.78rem", color: C.soft, cursor: "pointer", fontFamily: sans }}
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
          flex: 1, minHeight: 240,
          background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16,
          padding: "2rem 1.5rem", textAlign: "center", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: "1.25rem", userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {!flipped ? (
          <>
            <div style={{ fontFamily: serif, fontSize: "clamp(2rem, 9vw, 2.6rem)", lineHeight: 1.2 }}>{front || "—"}</div>
            <div style={{ color: C.muted, fontSize: "0.8rem", marginTop: "1.5rem" }}>Tap to reveal</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 7vw, 2.1rem)", fontWeight: 600, marginBottom: "1rem", lineHeight: 1.2 }}>{back || "—"}</div>
            {examplePrimary && (
              <div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{examplePrimary}</div>
            )}
            {exampleSecondary && (
              <div style={{ fontSize: "0.85rem", color: C.soft, fontStyle: "italic", lineHeight: 1.55, marginTop: "0.25rem" }}>{exampleSecondary}</div>
            )}
            {card.notes && (
              <div style={{ fontSize: "0.78rem", color: C.amber, marginTop: "0.85rem", lineHeight: 1.5 }}>{card.notes}</div>
            )}
          </>
        )}
      </div>

      {/* Action area: fixed height so flipping does not shift the layout. */}
      <div style={{ flexShrink: 0, minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            style={{
              width: "100%", padding: "1rem", borderRadius: 10,
              border: `1.5px solid ${C.green}`, background: C.green, color: "#fff",
              fontFamily: sans, fontSize: "1rem", fontWeight: 600, cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Reveal answer
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {RATINGS.map(({ label, rating, primary }) => (
                <button
                  key={label}
                  onClick={() => rate(card, rating)}
                  style={{
                    flex: 1, padding: "1rem 0.5rem", borderRadius: 10,
                    border: `1.5px solid ${primary ? C.green : C.border}`,
                    background: primary ? C.green : C.surface, color: primary ? "#fff" : C.text,
                    fontFamily: sans, fontSize: "1rem", cursor: "pointer", fontWeight: 600,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => rate(card, 5)}
              style={{ width: "100%", padding: "0.7rem", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.muted, fontFamily: sans, fontSize: "0.82rem", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.soft)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >
              Too easy — don't show again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ title, body, onDone, action }) {
  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center", boxSizing: "border-box" }}>
      <div style={{ fontFamily: serif, fontSize: "1.4rem", color: C.green, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>{body}</div>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        {action && <Btn onClick={action.onClick}>{action.label}</Btn>}
        <Btn variant="ghost" onClick={onDone}>Back to deck</Btn>
      </div>
    </div>
  );
}
