import { useState, useEffect } from "react";
import { C, serif, sans, ensureFonts } from "../tokens.js";
import { loadCards } from "./cards.js";
import AddWords from "./AddWords.jsx";
import Deck from "./Deck.jsx";
import Review from "./Review.jsx";

ensureFonts();

const TABS = [
  { key: "add", label: "Add words" },
  { key: "deck", label: "Deck" },
  { key: "review", label: "Review" },
];

export default function CardsApp() {
  const [tab, setTab] = useState("add");
  const [cards, setCards] = useState(null); // null = loading
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadCards().then(setCards);
  }, []);

  function fireToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const list = cards ?? [];
  const dueCount = list.filter(c => !c.retired && new Date(c.due_date) <= new Date()).length;

  return (
    <div style={{ fontFamily: sans, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", color: C.text }}>

      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
          background: C.text, color: "#fff", padding: "0.6rem 1.35rem", borderRadius: 30,
          fontSize: "0.82rem", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.18)", pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}

      {/* Standalone header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.1rem 1.5rem", display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span style={{ fontFamily: serif, fontSize: "1.4rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em" }}>Glōssa</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.amber, paddingBottom: "0.1rem" }}>Cards</span>
        </div>
        <nav style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem", display: "flex", gap: "1.5rem" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: "none", border: "none", cursor: "pointer", fontFamily: sans,
                fontSize: "0.85rem", fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? C.green : C.muted,
                padding: "0.6rem 0", marginBottom: "-1px",
                borderBottom: tab === t.key ? `2px solid ${C.green}` : "2px solid transparent",
              }}
            >
              {t.label}{t.key === "review" && dueCount > 0 ? ` (${dueCount})` : ""}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        {cards === null ? (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem", color: C.soft, fontSize: "0.9rem" }}>Loading…</div>
        ) : tab === "add" ? (
          <AddWords
            onSaved={(saved) => { setCards(prev => [...(prev ?? []), ...saved]); fireToast(`${saved.length} card${saved.length === 1 ? "" : "s"} saved`); setTab("deck"); }}
          />
        ) : tab === "deck" ? (
          <Deck cards={list} setCards={setCards} fireToast={fireToast} />
        ) : (
          <Review cards={list} setCards={setCards} onDone={() => setTab("deck")} />
        )}
      </main>
    </div>
  );
}
