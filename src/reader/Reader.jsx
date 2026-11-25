import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { C, serif, sans } from "../tokens.js";
import { Btn } from "../cards/ui.jsx";
import { insertCards } from "../cards/cards.js";
import { extractParagraphs } from "./pdf.js";
import { getParagraphAudio, translateWord } from "./tts.js";
import { ParagraphPlayer } from "./player.js";

const RATES = [0.75, 1, 1.25];

function tokenize(text) {
  const toks = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    toks.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return toks;
}

// Strip surrounding punctuation for dictionary lookup; keep display text intact.
function bareWord(s) {
  return s.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
}

export default function Reader({ userId, onCardSaved, fireToast }) {
  const [stage, setStage] = useState("upload"); // upload | reading
  const [fileName, setFileName] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [idx, setIdx] = useState(0);
  const [playState, setPlayState] = useState("idle"); // idle | loading | playing | paused | ended
  const [highlightChar, setHighlightChar] = useState(-1);
  const [rate, setRate] = useState(1);
  const [browserVoice, setBrowserVoice] = useState(false); // Azure not configured
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [popover, setPopover] = useState(null);

  const playerRef = useRef(null);
  const cacheRef = useRef(new Map()); // idx -> { audio, words } | { browser: true }
  const idxRef = useRef(0);
  const onEndRef = useRef(() => {});
  const paragraphsRef = useRef([]);

  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { paragraphsRef.current = paragraphs; }, [paragraphs]);

  // One player for the whole session; callbacks route through refs so they
  // always see the latest state.
  useEffect(() => {
    const p = new ParagraphPlayer({
      onBoundary: off => setHighlightChar(off),
      onEnd: () => onEndRef.current(),
      onState: s => setPlayState(s),
    });
    playerRef.current = p;
    return () => p.destroy();
  }, []);

  const tokens = useMemo(
    () => tokenize(paragraphs[idx] || ""),
    [paragraphs, idx],
  );

  const hlTok = useMemo(() => {
    if (highlightChar < 0) return -1;
    let r = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].start <= highlightChar) r = i;
      else break;
    }
    return r;
  }, [tokens, highlightChar]);

  // Warm the next paragraph's audio so playback is seamless.
  const prefetch = useCallback((i) => {
    const text = paragraphsRef.current[i];
    if (text == null || cacheRef.current.has(i)) return;
    getParagraphAudio(text, userId)
      .then(r => {
        cacheRef.current.set(i, r.unavailable ? { browser: true } : { audio: r.audio, words: r.words });
      })
      .catch(() => {});
  }, [userId]);

  // Load (and cache) a paragraph's audio, then optionally start playing.
  const prepare = useCallback(async (i, autoplay) => {
    const text = paragraphsRef.current[i];
    if (text == null) return;
    setHighlightChar(-1);
    let entry = cacheRef.current.get(i);
    if (!entry) {
      setPlayState("loading");
      try {
        const r = await getParagraphAudio(text, userId);
        entry = r.unavailable ? { browser: true } : { audio: r.audio, words: r.words };
      } catch (e) {
        console.warn("[reader] audio error, using browser voice:", e.message);
        entry = { browser: true };
      }
      cacheRef.current.set(i, entry);
    }
    if (entry.browser) setBrowserVoice(true);
    if (idxRef.current !== i) return; // moved on while loading

    if (entry.browser) playerRef.current.loadBrowser(text);
    else playerRef.current.loadAzure(entry.audio, entry.words, text);

    if (autoplay) playerRef.current.play(0);
    else setPlayState("idle");

    prefetch(i + 1);
  }, [userId, prefetch]);

  // Auto-advance to the next paragraph when one finishes.
  useEffect(() => {
    onEndRef.current = () => {
      const next = idxRef.current + 1;
      if (next < paragraphsRef.current.length) {
        setIdx(next);
        prepare(next, true);
      } else {
        setPlayState("ended");
      }
    };
  }, [prepare]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPdfBusy(true);
    setPdfError("");
    try {
      const buf = await file.arrayBuffer();
      const paras = await extractParagraphs(buf);
      if (paras.length === 0) {
        setPdfError("No readable text found. This looks like a scanned PDF (not supported yet).");
        setPdfBusy(false);
        return;
      }
      cacheRef.current = new Map();
      setFileName(file.name);
      setParagraphs(paras);
      paragraphsRef.current = paras;
      setIdx(0);
      idxRef.current = 0;
      setStage("reading");
      setPdfBusy(false);
      prepare(0, false);
    } catch (err) {
      console.error("[reader] pdf error:", err);
      setPdfError("Could not read this PDF. Try a different file.");
      setPdfBusy(false);
    }
  }

  function goTo(i) {
    if (i < 0 || i >= paragraphs.length) return;
    playerRef.current.pause();
    setIdx(i);
    setPopover(null);
    prepare(i, false);
  }

  function togglePlay() {
    const p = playerRef.current;
    if (playState === "playing") p.pause();
    else if (playState === "paused") p.resume();
    else p.play(0); // idle or ended -> (re)start
  }

  function cycleRate() {
    const i = RATES.indexOf(rate);
    const next = RATES[(i + 1) % RATES.length];
    setRate(next);
    playerRef.current.setRate(next);
  }

  function onWordTap(tok) {
    playerRef.current.pause();
    const lookup = bareWord(tok.text);
    if (!lookup) return;
    setPopover({ word: lookup, display: tok.text, start: tok.start, loading: true });
    translateWord(lookup, paragraphsRef.current[idxRef.current])
      .then(data => setPopover(p => (p && p.start === tok.start ? { ...p, loading: false, data } : p)))
      .catch(() => setPopover(p => (p && p.start === tok.start ? { ...p, loading: false, error: true } : p)));
  }

  function playFromWord() {
    if (!popover) return;
    const start = popover.start;
    setPopover(null);
    playerRef.current.play(start);
  }

  async function saveCard() {
    if (!popover?.data) return;
    setPopover(p => ({ ...p, saving: true }));
    const { dictionary, meaning, grammar } = popover.data;
    const card = {
      greek: dictionary,
      english: meaning,
      partOfSpeech: "",
      gender: "",
      exampleGreek: paragraphsRef.current[idxRef.current],
      exampleTranslation: "",
      notes: grammar,
      sourceInput: popover.word,
    };
    try {
      const saved = await insertCards([card], userId);
      onCardSaved?.(saved[0]);
      fireToast?.("Saved to deck");
    } catch (e) {
      fireToast?.(`Could not save: ${e.message}`);
    }
    setPopover(null);
  }

  // ---- Upload stage ----
  if (stage === "upload") {
    return (
      <div style={{ width: "100%", maxWidth: 620, margin: "0 auto", padding: "2.5rem 1.5rem", boxSizing: "border-box" }}>
        <div style={{ fontFamily: serif, fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.3rem" }}>Read</div>
        <div style={{ color: C.soft, fontSize: "0.88rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
          Upload a Greek PDF and hear it read aloud, word by word. Tap any word to see what it means and save it to your deck.
        </div>

        <label style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "0.75rem", textAlign: "center", cursor: pdfBusy ? "default" : "pointer",
          border: `1.5px dashed ${C.border}`, borderRadius: 16, padding: "3rem 1.5rem",
          background: C.surface, color: C.soft,
        }}>
          <input type="file" accept="application/pdf,.pdf" onChange={onFile} disabled={pdfBusy} style={{ display: "none" }} />
          <div style={{ fontFamily: serif, fontSize: "1.1rem", color: C.text }}>
            {pdfBusy ? "Reading your PDF…" : "Choose a PDF"}
          </div>
          <div style={{ fontSize: "0.8rem", color: C.muted }}>
            {pdfBusy ? "Extracting text on your device" : "Text-based PDFs only (not scanned books)"}
          </div>
        </label>

        {pdfError && (
          <div style={{ marginTop: "1rem", color: C.wrong, fontSize: "0.85rem", lineHeight: 1.6 }}>{pdfError}</div>
        )}
      </div>
    );
  }

  // ---- Reading stage ----
  const atEnd = idx >= paragraphs.length - 1;
  const playLabel = playState === "loading" ? "…" : playState === "playing" ? "Pause" : "Play";

  return (
    <div style={{ width: "100%", maxWidth: 620, margin: "0 auto", padding: "1.25rem 1.25rem 7rem", boxSizing: "border-box" }}>
      {/* File bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.8rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
        <button
          onClick={() => { playerRef.current.pause(); setStage("upload"); setParagraphs([]); setPopover(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: sans, fontSize: "0.78rem", color: C.soft, flexShrink: 0 }}
        >
          New PDF
        </button>
      </div>

      {browserVoice && !noteDismissed && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", background: C.amberLight, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.7rem 0.85rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: C.soft, lineHeight: 1.55, flex: 1 }}>
            Using your device's built-in Greek voice. Add an Azure Speech key for a natural voice and reliable word-by-word sync on mobile.
          </span>
          <button onClick={() => setNoteDismissed(true)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.9rem", lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Paragraph */}
      <div style={{ fontFamily: serif, fontSize: "1.3rem", lineHeight: 1.9, color: C.text, marginBottom: "1.5rem" }}>
        {tokens.map((tok, i) => (
          <span key={tok.start}>
            <span
              onClick={() => onWordTap(tok)}
              style={{
                cursor: "pointer", borderRadius: 4, padding: "0.05em 0.08em",
                background: i === hlTok ? C.greenLight : "transparent",
                color: i === hlTok ? C.green : "inherit",
                transition: "background 0.1s, color 0.1s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {tok.text}
            </span>
            {" "}
          </span>
        ))}
      </div>

      {atEnd && playState === "ended" && (
        <div style={{ color: C.green, fontFamily: serif, fontSize: "1rem", marginBottom: "1rem" }}>End of document.</div>
      )}

      {/* Sticky controls */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => goTo(idx - 1)} disabled={idx === 0}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.6rem 0.75rem", color: idx === 0 ? C.muted : C.soft, cursor: idx === 0 ? "default" : "pointer", fontFamily: sans, fontSize: "0.9rem" }}>
            ‹
          </button>

          <button onClick={togglePlay}
            style={{ flex: 1, background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "0.85rem", fontFamily: sans, fontSize: "1rem", fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            {playLabel}
          </button>

          <button onClick={cycleRate}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.6rem 0.7rem", color: C.soft, cursor: "pointer", fontFamily: sans, fontSize: "0.82rem", minWidth: 52 }}>
            {rate}×
          </button>

          <button onClick={() => goTo(idx + 1)} disabled={atEnd}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.6rem 0.75rem", color: atEnd ? C.muted : C.soft, cursor: atEnd ? "default" : "pointer", fontFamily: sans, fontSize: "0.9rem" }}>
            ›
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: "0.72rem", color: C.muted, paddingBottom: "0.5rem" }}>
          {idx + 1} / {paragraphs.length}
        </div>
      </div>

      {/* Word popover */}
      {popover && (
        <>
          <div onClick={() => setPopover(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 50 }} />
          <div style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 51,
            background: C.surface, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0",
            padding: "1.25rem 1.5rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.12)", maxWidth: 620, margin: "0 auto",
          }}>
            <div style={{ fontFamily: serif, fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.35rem" }}>{popover.display}</div>
            {popover.loading ? (
              <div style={{ color: C.muted, fontSize: "0.85rem", padding: "0.5rem 0" }}>Looking it up…</div>
            ) : popover.error ? (
              <div style={{ color: C.wrong, fontSize: "0.85rem", padding: "0.5rem 0" }}>Could not look that up. Try again.</div>
            ) : (
              <>
                <div style={{ fontSize: "0.95rem", color: C.text, marginBottom: "0.2rem" }}>
                  {popover.data.meaning || "—"}
                </div>
                {popover.data.dictionary && popover.data.dictionary !== popover.display && (
                  <div style={{ fontSize: "0.85rem", color: C.soft }}>Dictionary form: <span style={{ fontFamily: serif }}>{popover.data.dictionary}</span></div>
                )}
                {popover.data.grammar && (
                  <div style={{ fontSize: "0.8rem", color: C.amber, marginTop: "0.35rem", fontStyle: "italic" }}>{popover.data.grammar}</div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.1rem" }}>
              <Btn onClick={saveCard} disabled={popover.loading || popover.error || popover.saving} style={{ flex: 1 }}>
                {popover.saving ? "Saving…" : "Save to deck"}
              </Btn>
              <Btn variant="ghost" onClick={playFromWord}>Play from here</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
