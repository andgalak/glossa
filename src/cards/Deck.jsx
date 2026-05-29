import { useState } from "react";
import { C, serif, sans } from "../tokens.js";
import { Btn, Field } from "./ui.jsx";
import { updateCard, deleteCard } from "./cards.js";

const POS = ["noun", "verb", "adjective", "adverb", "phrase", "other"];
const EDITABLE = ["greek", "english", "part_of_speech", "gender", "example_greek", "example_translation", "notes"];

export default function Deck({ cards, setCards, fireToast }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? cards.filter(c => (c.english + " " + c.greek + " " + c.source_input).toLowerCase().includes(q))
    : cards;

  function onDelete(id) {
    setCards(prev => prev.filter(c => c.id !== id));
    deleteCard(id);
    fireToast("Card deleted");
  }

  function onSaveEdit(id, patch) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    updateCard(id, patch);
    fireToast("Saved");
  }

  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: serif, fontSize: "1.4rem", marginBottom: "0.6rem" }}>Your deck is empty</div>
        <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7 }}>Add some words to get started.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: serif, fontSize: "1.5rem", fontWeight: 600 }}>Deck</div>
        <span style={{ fontSize: "0.8rem", color: C.soft }}>{cards.length} card{cards.length === 1 ? "" : "s"}</span>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search…"
        style={{
          width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8,
          padding: "0.6rem 0.9rem", fontSize: "0.9rem", fontFamily: sans, outline: "none",
          background: C.surface, color: C.text, marginBottom: "1.25rem",
        }}
        onFocus={e => (e.target.style.borderColor = C.green)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {filtered.map(card => (
          <DeckRow key={card.id} card={card} onDelete={() => onDelete(card.id)} onSave={patch => onSaveEdit(card.id, patch)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ color: C.muted, fontSize: "0.88rem", padding: "1rem 0" }}>No matches.</div>
        )}
      </div>
    </div>
  );
}

function DeckRow({ card, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card);

  function set(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function save() {
    const patch = {};
    for (const k of EDITABLE) if (draft[k] !== card[k]) patch[k] = draft[k] ?? "";
    if (Object.keys(patch).length > 0) onSave(patch);
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ background: C.surface, border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "1rem 1.1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem", marginBottom: "0.7rem" }}>
          <Field label="Greek" value={draft.greek ?? ""} onChange={v => set("greek", v)} />
          <Field label="English" value={draft.english ?? ""} onChange={v => set("english", v)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem", marginBottom: "0.7rem" }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, marginBottom: "0.25rem" }}>Part of speech</span>
            <select value={draft.part_of_speech ?? ""} onChange={e => set("part_of_speech", e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", fontFamily: sans, outline: "none", background: C.surface, color: C.text }}>
              <option value="">—</option>
              {POS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, marginBottom: "0.25rem" }}>Gender</span>
            <select value={draft.gender ?? ""} onChange={e => set("gender", e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", fontFamily: sans, outline: "none", background: C.surface, color: C.text }}>
              <option value="">—</option>
              <option value="ο">ο</option>
              <option value="η">η</option>
              <option value="το">το</option>
            </select>
          </label>
        </div>
        <div style={{ display: "grid", gap: "0.7rem", marginBottom: "0.85rem" }}>
          <Field label="Example (Greek)" value={draft.example_greek ?? ""} onChange={v => set("example_greek", v)} multiline />
          <Field label="Example (English)" value={draft.example_translation ?? ""} onChange={v => set("example_translation", v)} multiline />
          <Field label="Notes" value={draft.notes ?? ""} onChange={v => set("notes", v)} />
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Btn small onClick={save}>Save</Btn>
          <Btn small variant="ghost" onClick={() => { setDraft(card); setEditing(false); }}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.9rem 1rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontFamily: serif, fontWeight: 600, fontSize: "1.05rem" }}>{card.greek || "—"}</span>
          {card.part_of_speech && <span style={{ fontSize: "0.7rem", color: C.amber, fontStyle: "italic" }}>{card.part_of_speech}</span>}
        </div>
        <div style={{ fontSize: "0.85rem", color: C.soft, marginTop: "0.15rem" }}>{card.english || "—"}</div>
        {card.example_greek && (
          <div style={{ fontSize: "0.78rem", color: C.muted, marginTop: "0.35rem", fontStyle: "italic", lineHeight: 1.5 }}>{card.example_greek}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
        <button onClick={() => { setDraft(card); setEditing(true); }} title="Edit" style={{ background: "none", border: "none", color: C.soft, cursor: "pointer", fontSize: "0.78rem", fontFamily: sans }}>Edit</button>
        <button onClick={onDelete} title="Delete" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.9rem", lineHeight: 1 }}>✕</button>
      </div>
    </div>
  );
}
