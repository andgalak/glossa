import { useState } from "react";
import { C, serif, sans } from "../tokens.js";
import { Btn, Field } from "./ui.jsx";
import { generateCard, insertCards } from "./cards.js";

const CONCURRENCY = 3;
const POS = ["noun", "verb", "adjective", "adverb", "phrase", "other"];

const blankRow = (input) => ({
  sourceInput: input,
  english: "", greek: "", partOfSpeech: "", gender: "",
  exampleGreek: "", exampleTranslation: "", notes: "",
  status: "pending", // pending | done | error
});

export default function AddWords({ onSaved }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const words = text.split("\n").map(w => w.trim()).filter(Boolean);
  const done = rows.filter(r => r.status !== "pending").length;
  const okRows = rows.filter(r => r.status === "done");

  async function generate() {
    const initial = words.map(blankRow);
    setRows(initial);
    setBusy(true);

    let cursor = 0;
    async function worker() {
      while (cursor < initial.length) {
        const i = cursor++;
        try {
          const card = await generateCard(initial[i].sourceInput);
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...card, status: "done" } : r));
        } catch {
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error" } : r));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, initial.length) }, worker));
    setBusy(false);
  }

  function patch(i, key, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  }

  function removeRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function markUsable(i) {
    // Lets the user keep a failed row and fill it in from scratch.
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "done" } : r));
  }

  async function save() {
    const toSave = rows.filter(r => r.status === "done");
    if (toSave.length === 0) return;
    setSaving(true);
    const saved = await insertCards(toSave);
    setSaving(false);
    setRows([]);
    setText("");
    onSaved(saved);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <div style={{ fontFamily: serif, fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.3rem" }}>Add words</div>
      <div style={{ color: C.soft, fontSize: "0.88rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Paste words one per line, in English or Greek. We fill in the translation, part of speech, gender, and an example sentence. You can fix anything before saving.
      </div>

      {rows.length === 0 && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"θάλασσα\nto run\nόμορφος\nbreakfast"}
            rows={8}
            style={{
              width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: "0.9rem 1rem", fontSize: "1rem", fontFamily: sans,
              outline: "none", background: C.surface, color: C.text, lineHeight: 1.7, resize: "vertical",
            }}
            onFocus={e => (e.target.style.borderColor = C.green)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
            <Btn onClick={generate} disabled={words.length === 0}>
              Generate {words.length > 0 ? `(${words.length})` : ""}
            </Btn>
            <span style={{ fontSize: "0.8rem", color: C.muted }}>{words.length} word{words.length === 1 ? "" : "s"}</span>
          </div>
        </>
      )}

      {rows.length > 0 && (
        <>
          {busy && (
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: C.soft, marginBottom: "0.4rem" }}>
                Generating… {done} / {rows.length}
              </div>
              <div style={{ background: C.border, borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(done / rows.length) * 100}%`, background: C.green, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {rows.map((r, i) => (
              <CardRow key={i} row={r} onPatch={(k, v) => patch(i, k, v)} onRemove={() => removeRow(i)} onMarkUsable={() => markUsable(i)} />
            ))}
          </div>

          {!busy && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.5rem" }}>
              <Btn onClick={save} disabled={okRows.length === 0 || saving}>
                {saving ? "Saving…" : `Save to deck (${okRows.length})`}
              </Btn>
              <Btn variant="ghost" onClick={() => { setRows([]); }}>Start over</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CardRow({ row, onPatch, onRemove, onMarkUsable }) {
  const isError = row.status === "error";
  const isPending = row.status === "pending";

  return (
    <div style={{
      background: C.surface,
      border: `1.5px solid ${isError ? C.wrong : C.border}`,
      borderRadius: 12, padding: "1rem 1.1rem",
      opacity: isPending ? 0.55 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isPending ? 0 : "0.85rem" }}>
        <div style={{ fontSize: "0.78rem", color: C.muted }}>
          <span style={{ fontWeight: 600, color: C.soft }}>{row.sourceInput}</span>
          {isPending && <span style={{ marginLeft: "0.5rem" }}>…</span>}
          {isError && <span style={{ marginLeft: "0.5rem", color: C.wrong, fontWeight: 600 }}>generation failed — fill in manually or remove</span>}
        </div>
        <button onClick={onRemove} title="Remove" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.9rem", lineHeight: 1 }}>✕</button>
      </div>

      {isPending ? null : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", marginBottom: "0.7rem" }}>
            <Field label="Greek" value={row.greek} onChange={v => onPatch("greek", v)} placeholder="η θάλασσα" />
            <Field label="English" value={row.english} onChange={v => onPatch("english", v)} placeholder="the sea" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", marginBottom: "0.7rem" }}>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, marginBottom: "0.25rem" }}>Part of speech</span>
              <select
                value={row.partOfSpeech}
                onChange={e => onPatch("partOfSpeech", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", fontFamily: sans, outline: "none", background: C.surface, color: C.text }}
              >
                <option value="">—</option>
                {POS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, marginBottom: "0.25rem" }}>Gender</span>
              <select
                value={row.gender}
                onChange={e => onPatch("gender", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", fontFamily: sans, outline: "none", background: C.surface, color: C.text }}
              >
                <option value="">—</option>
                <option value="ο">ο</option>
                <option value="η">η</option>
                <option value="το">το</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gap: "0.7rem", marginBottom: "0.7rem" }}>
            <Field label="Example (Greek)" value={row.exampleGreek} onChange={v => onPatch("exampleGreek", v)} multiline />
            <Field label="Example (English)" value={row.exampleTranslation} onChange={v => onPatch("exampleTranslation", v)} multiline />
            <Field label="Notes" value={row.notes} onChange={v => onPatch("notes", v)} placeholder="irregular forms, register…" />
          </div>
          {isError && (
            <Btn small variant="ghost" onClick={onMarkUsable}>Keep this row</Btn>
          )}
        </>
      )}
    </div>
  );
}
