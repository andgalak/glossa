import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import { sm2 } from "./lib/sm2.js";
import AuthScreen from "./components/AuthScreen.jsx";

// ── Fonts ────────────────────────────────────────────────────────────────────
const fontStyle = document.createElement("style");
fontStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;
document.head.appendChild(fontStyle);

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  soft: "#6E6760",
  muted: "#A8A09A",
  green: "#2B5F47",
  greenLight: "#EAF0EC",
  greenMid: "#4A8A6A",
  border: "#DDD6CB",
  amber: "#B87B2A",
  amberLight: "#FDF3E0",
  correct: "#2B5F47",
  wrong: "#B04040",
  wrongLight: "#FAEAEA",
  correctLight: "#EAF4EE",
};

const serif = "'Lora', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

// ── Data ──────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "el", name: "Greek", flag: "🇬🇷", available: true },
  { code: "es", name: "Spanish", flag: "🇪🇸", available: false },
  { code: "fr", name: "French", flag: "🇫🇷", available: false },
  { code: "tr", name: "Turkish", flag: "🇹🇷", available: false },
  { code: "ja", name: "Japanese", flag: "🇯🇵", available: false },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", available: false },
];

const LEVELS = [
  { code: "A1", desc: "You know almost nothing yet. That's fine." },
  { code: "A2", desc: "You can handle the basics in slow, simple conversations." },
  { code: "B1", desc: "Everyday conversations with some effort." },
  { code: "B2", desc: "Comfortable with most topics. Gaps remain." },
  { code: "C1", desc: "Near-fluent. Nuance and speed are the challenge." },
  { code: "C2", desc: "Indistinguishable from a native in most contexts." },
];

const CHAPTERS = [
  { id: 1,  theme: "Greetings & Introductions",       grammar: "To Be / Personal Pronouns" },
  { id: 2,  theme: "Numbers & Time",                  grammar: "Cardinal Numbers, Clock" },
  { id: 3,  theme: "Food & Drink",                    grammar: "Present Tense: τρώω, πίνω, θέλω" },
  { id: 4,  theme: "Family & People",                 grammar: "Possessive Pronouns" },
  { id: 5,  theme: "Getting Around",                  grammar: "Preposition + Article Fusions" },
  { id: 6,  theme: "Shopping & Prices",               grammar: "Accusative Case Basics" },
  { id: 7,  theme: "Home & Rooms",                    grammar: "Adjective Agreement (Nominative)" },
  { id: 8,  theme: "Daily Routine",                   grammar: "Present Tense Verb Conjugation" },
  { id: 9,  theme: "Past Experiences",                grammar: "Simple Past (Aorist)" },
  { id: 10, theme: "Making Plans",                    grammar: "Future with θα" },
  { id: 11, theme: "Describing People & Things",      grammar: "Adjective Agreement (All Cases)" },
  { id: 12, theme: "Obligations & Wishes",            grammar: "Modals: πρέπει να, θέλω να" },
  { id: 13, theme: "Quantities & Comparisons",        grammar: "Genitive Case" },
  { id: 14, theme: "Health & Feelings",               grammar: "Impersonal Verbs: με πονάει, μου αρέσει" },
  { id: 15, theme: "Instructions & Directions",       grammar: "Imperative Mood" },
  { id: 16, theme: "Transport & Travel",              grammar: "Imperfect Tense (Past Habits)" },
  { id: 17, theme: "Telling Stories",                 grammar: "Aorist vs Imperfect" },
  { id: 18, theme: "Opinions & Discussion",           grammar: "Subordinate Clauses" },
  { id: 19, theme: "Hypotheticals & Conditions",      grammar: "Conditional Sentences" },
  { id: 20, theme: "Work & Ambitions",                grammar: "Indirect Speech" },
  { id: 21, theme: "Relationships & Social Life",     grammar: "Genitive of Possession" },
  { id: 22, theme: "Media & Current Events",          grammar: "Passive Voice" },
  { id: 23, theme: "Processes & Instructions",        grammar: "Impersonal & Passive Constructions" },
  { id: 24, theme: "Comparisons & Extremes",          grammar: "Comparative & Superlative" },
];

// ── Chapter Prompts ───────────────────────────────────────────────────────────
const PROMPT_PREFIX = `You are a rigorous Greek language instructor who cares deeply about teaching correct modern Greek. Generate 10 cloze sentences where the blank tests exactly one grammar point. Rules: Greek sentence first. Natural spoken Greek, not formal or textbook. The blank must unambiguously require the target form — no other word should fit grammatically. Vary sentence subjects (not always εγώ). Include a mix of genders and real Greek names. Output ONLY a valid JSON array with these exact fields: before, answer, after, naturalTranslation, gloss, greekGrammarTags, englishGrammarTags, grammarLabel, grammarShort. No preamble, no markdown fences, no trailing comma.`;

const CHAPTER_PROMPTS = {
  1: `${PROMPT_PREFIX}
Level: A1. Theme: greetings and introductions.
Grammar focus: εἶμαι (to be) in all six persons — είμαι, είσαι, είναι, είμαστε, είστε, είναι.
The blank must always be a conjugated form of είμαι.
Example of what to aim for: "Εγώ ___ δάσκαλος." → είμαι`,

  2: `${PROMPT_PREFIX}
Level: A1. Theme: numbers, dates, and telling the time.
Grammar focus: cardinal numbers as they appear in real phrases — phone numbers, prices, ages, clock times.
The blank must always be a number word (e.g. τρεις, δώδεκα, είκοσι πέντε).
Example: "Η συνάντηση είναι στις ___ το απόγευμα." → τρεις`,

  3: `${PROMPT_PREFIX}
Level: A1. Theme: food and drink ordering.
Grammar focus: high-frequency verbs τρώω, πίνω, θέλω, παίρνω in present tense, all persons.
The blank must always be a conjugated present-tense verb.
Sentences should feel like things you'd say at a Greek café or taverna.
Example: "Ο Νίκος ___ καφέ κάθε πρωί." → πίνει`,

  4: `${PROMPT_PREFIX}
Level: A1. Theme: family and people.
Grammar focus: possessive pronouns μου, σου, του, της, μας, σας, τους attached to nouns.
The blank must always be a possessive pronoun clitic.
Vary the noun genders so learners encounter all three.
Example: "Πού είναι η μητέρα ___;" → σου`,

  5: `${PROMPT_PREFIX}
Level: A1. Theme: getting around the city.
Grammar focus: prepositions fused with the definite article — στο, στη, στην, στον, από το, για το.
The blank must always be a preposition+article fusion.
Use real Athens landmarks and everyday destinations.
Example: "Πηγαίνω ___ σούπερ μάρκετ." → στο`,

  6: `${PROMPT_PREFIX}
Level: A1. Theme: shopping and prices.
Grammar focus: accusative case — direct objects with masculine, feminine, and neuter nouns. The article changes: τον, την, το.
The blank must always be an accusative article or article+noun pair.
Example: "Θέλω ___ λογαριασμό, παρακαλώ." → τον`,

  7: `${PROMPT_PREFIX}
Level: A1. Theme: the home and describing rooms.
Grammar focus: adjective agreement in gender and number — nominative case only.
The blank must always be an adjective in the correct gender/number form.
Use all three genders across the 10 sentences.
Example: "Το δωμάτιο είναι πολύ ___." → μικρό`,

  8: `${PROMPT_PREFIX}
Level: A1. Theme: daily routine.
Grammar focus: present tense conjugation of common -ω verbs — ξυπνώ, δουλεύω, τελειώνω, φεύγω, φτάνω.
The blank must always be a conjugated present-tense form. Use all six persons across the 10 sentences.
Example: "Η Μαρία ___ στις οχτώ το πρωί." → ξυπνάει`,

  9: `${PROMPT_PREFIX}
Level: A2. Theme: past experiences and recent events.
Grammar focus: simple past (aorist) of common verbs — έφαγα, ήπια, πήγα, είδα, έκανα.
The blank must always be an aorist form. Use time words (χθες, πέρυσι, πριν) to make the tense unambiguous.
Example: "Χθες ___ στη θάλασσα με τους φίλους μου." → πήγα`,

  10: `${PROMPT_PREFIX}
Level: A2. Theme: making plans and talking about the future.
Grammar focus: future with θα + verb (imperfective for ongoing, perfective for completed action).
The blank must always be a θα + verb construction. Make the future time reference explicit.
Example: "Αύριο ___ στην Αθήνα." → θα πάω`,

  11: `${PROMPT_PREFIX}
Level: A2. Theme: describing people and things.
Grammar focus: adjective agreement across all cases and genders — nominative and accusative.
The blank must force the learner to choose the correct gender AND case form of the adjective.
Example: "Αγόρασα ένα ___ φόρεμα για το πάρτι." → ωραίο`,

  12: `${PROMPT_PREFIX}
Level: A2. Theme: obligations, wishes, and suggestions.
Grammar focus: modal constructions — πρέπει να, θέλω να, μπορώ να + subjunctive verb.
The blank must always be the subjunctive verb form that follows the modal.
Example: "Πρέπει να ___ νερό κάθε μέρα." → πίνεις`,

  13: `${PROMPT_PREFIX}
Level: A2. Theme: shopping, quantities, and comparisons.
Grammar focus: genitive case for possession and quantity — του, της, των + noun.
The blank must always be a genitive article or genitive noun phrase.
Example: "Το χρώμα ___ αυτοκινήτου είναι κόκκινο." → του`,

  14: `${PROMPT_PREFIX}
Level: A2. Theme: health, body, and feelings.
Grammar focus: reflexive and impersonal verbs — με πονάει, νιώθω, αισθάνομαι, μου αρέσει.
The blank must always be one of these verb forms in the correct person.
Example: "Με ___ το κεφάλι σήμερα." → πονάει`,

  15: `${PROMPT_PREFIX}
Level: A2. Theme: giving and following instructions.
Grammar focus: imperative mood — singular and plural, both perfective and imperfective aspect.
The blank must always be an imperative form. Make it clear from context whether singular or plural is needed.
Example: "Γύρνα ___ δεξιά στο φανάρι." → δεξιά`,

  16: `${PROMPT_PREFIX}
Level: A2. Theme: transport and travel.
Grammar focus: imperfect tense (παρατατικός) for past habits and ongoing past states.
The blank must always be an imperfect form. Use context (κάθε μέρα, συχνά, πάντα) to signal ongoing past.
Example: "Κάθε καλοκαίρι ___ στη Ρόδο." → πηγαίναμε`,

  17: `${PROMPT_PREFIX}
Level: B1. Theme: telling stories and recounting events.
Grammar focus: aorist vs imperfect contrast in narrative — knowing when to use each.
The blank must force a choice between aorist and imperfect. The surrounding sentence must make the correct aspect unambiguous.
Example: "Ενώ ___ ο Γιώργης τηλεφώνησε." → διάβαζα`,

  18: `${PROMPT_PREFIX}
Level: B1. Theme: opinions, arguments, and discussion.
Grammar focus: subordinate clauses with ότι, που, γιατί, αν — verb stays indicative after these.
The blank must always be a correctly conjugated indicative verb inside a subordinate clause.
Example: "Νομίζω ότι αυτή η ταινία ___ πολύ καλή." → είναι`,

  19: `${PROMPT_PREFIX}
Level: B1. Theme: hypotheticals and conditions.
Grammar focus: conditional sentences — αν + present/subjunctive in the condition, future/conditional in the result.
The blank must always be the correct verb form in either the condition or result clause.
Example: "Αν έχεις χρόνο, ___ μαζί για καφέ." → πάμε`,

  20: `${PROMPT_PREFIX}
Level: B1. Theme: work, ambitions, and life decisions.
Grammar focus: indirect speech — reporting what someone said using είπε ότι, είπε να, ρώτησε αν.
The blank must always be the verb form inside the reported clause, correctly shifted for indirect speech.
Example: "Μου είπε ότι ___ αύριο." → έρχεται`,

  21: `${PROMPT_PREFIX}
Level: B1. Theme: relationships and social life.
Grammar focus: genitive of possession with proper nouns and pronouns.
The blank must force use of the genitive, including cases where Greek uses genitive where English uses apostrophe-s.
Example: "Αυτό είναι το σπίτι ___." → της Ελένης`,

  22: `${PROMPT_PREFIX}
Level: B1. Theme: media, news, and current events.
Grammar focus: passive voice in present and past — the -μαι/-ομαι verb endings.
The blank must always be a passive verb form.
Example: "Η απόφαση ___ χθες από την κυβέρνηση." → ανακοινώθηκε`,

  23: `${PROMPT_PREFIX}
Level: B1. Theme: describing processes and giving detailed instructions.
Grammar focus: impersonal constructions and passive imperatives — πρέπει να γίνει, χρειάζεται να, έτσι γίνεται.
The blank must always be an impersonal or passive construction that describes a process step.
Example: "Πρώτα ___ το κρέας για δέκα λεπτά." → ψήνεται`,

  24: `${PROMPT_PREFIX}
Level: B1. Theme: expressing degrees, comparisons, and extremes.
Grammar focus: comparative and superlative — πιο + adjective, ο πιο + adjective, καλύτερος/χειρότερος irregular forms.
The blank must always be a comparative or superlative form, including irregular ones.
Example: "Αυτό το εστιατόριο είναι ___ από εκείνο." → καλύτερο`,
};

// ── Utility ───────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled = false, small = false, style: extra = {} }) {
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

// ── WordSpan – double-click / long-press to save ─────────────────────────────
function WordSpan({ text, onSave }) {
  return (
    <>
      {text.split(/(\s+)/).map((tok, i) => {
        if (!tok.trim()) return <span key={i}>{tok}</span>;
        let pressTimer = null;
        const word = tok.replace(/[.,!?;:«»]/g, "");
        return (
          <span
            key={i}
            onDoubleClick={() => onSave(word)}
            onTouchStart={() => { pressTimer = setTimeout(() => onSave(word), 500); }}
            onTouchEnd={() => { clearTimeout(pressTimer); }}
            onTouchMove={() => { clearTimeout(pressTimer); }}
            title="Double-click to save to flashcards"
            style={{ cursor: "default", borderRadius: 3, padding: "1px 0", transition: "background 0.12s" }}
            onMouseEnter={e => (e.target.style.background = C.amberLight)}
            onMouseLeave={e => (e.target.style.background = "transparent")}
          >
            {tok}
          </span>
        );
      })}
    </>
  );
}

// ── Loading Screen ────────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Bribing the muses for better sentences…",
  "Conjugating verbs at an alarming rate…",
  "Consulting ancient Athenian scrolls…",
  "Arguing with a Greek grandmother about grammar…",
  "Translating Homer's grocery list…",
  "Asking Socrates what the answer is…",
  "Polishing the accusative case…",
  "Teaching the subjunctive to behave…",
  "Stealing fire from the gods of grammar…",
  "Running through Athens without shoes…",
];

function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "calc(100vh - 62px)", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: sans, gap: "1.5rem" }}>
      <div style={{ fontFamily: serif, fontSize: "2rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em" }}>Glōssa</div>
      <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease", fontSize: "0.875rem", color: C.soft, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        {LOADING_MESSAGES[msgIdx]}
      </div>
      <div style={{ width: 120, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: "40%",
          background: C.green,
          borderRadius: 2,
          animation: "glossaSlide 1.2s ease-in-out infinite alternate",
        }} />
      </div>
      <style>{`@keyframes glossaSlide { from { margin-left: 0 } to { margin-left: 60% } }`}</style>
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

function Welcome({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: "2rem" }}>
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontFamily: serif, fontSize: "3.25rem", fontWeight: 600, color: C.green, letterSpacing: "-0.02em", marginBottom: "0.4rem" }}>
          Glōssa
        </div>
        <div style={{ fontSize: "1rem", color: C.soft, marginBottom: "2.5rem", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500, fontSize: "0.8rem" }}>
          Real levels. Real grammar. No streaks, no nonsense.
        </div>
        <p style={{ color: C.soft, lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "3rem" }}>
          Built for learners who want structured progress. Every sentence teaches something specific. Every word you save becomes a flashcard with context you'll actually remember.
        </p>
        <Btn onClick={onStart}>Get Started</Btn>
      </div>
    </div>
  );
}

function LanguagePicker({ onSelect, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, padding: "3rem 2rem" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.soft, fontSize: "0.875rem", cursor: "pointer", fontFamily: sans, padding: 0, marginBottom: "1.5rem", display: "block" }}>← Back</button>
        <div style={{ fontFamily: serif, fontSize: "1.75rem", fontWeight: 600, color: C.text, marginBottom: "0.35rem" }}>Choose a language</div>
        <div style={{ color: C.soft, fontSize: "0.875rem", marginBottom: "2.5rem" }}>More languages arriving soon.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => l.available && onSelect(l)}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 12,
                padding: "1.1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                cursor: l.available ? "pointer" : "not-allowed",
                opacity: l.available ? 1 : 0.48,
                fontFamily: sans,
                textAlign: "left",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { if (l.available) { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.boxShadow = "0 2px 12px rgba(43,95,71,0.1)"; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: "1.9rem" }}>{l.flag}</span>
              <div>
                <div style={{ fontWeight: 500, color: C.text, fontSize: "0.95rem" }}>{l.name}</div>
                {!l.available && <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: "0.1rem" }}>Coming soon</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelPicker({ onSelect, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, padding: "3rem 2rem" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.soft, fontSize: "0.875rem", cursor: "pointer", fontFamily: sans, padding: 0, marginBottom: "1.5rem", display: "block" }}>← Back</button>
        <div style={{ fontFamily: serif, fontSize: "1.75rem", fontWeight: 600, color: C.text, marginBottom: "0.35rem" }}>What's your level?</div>
        <div style={{ color: C.soft, fontSize: "0.875rem", marginBottom: "2.5rem" }}>You can change this any time. When in doubt, go one lower.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {LEVELS.map(l => (
            <button
              key={l.code}
              onClick={() => onSelect(l)}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
                fontFamily: sans,
                textAlign: "left",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.boxShadow = "0 2px 12px rgba(43,95,71,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{
                background: C.greenLight,
                color: C.green,
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: 6,
                padding: "0.25rem 0.65rem",
                minWidth: 36,
                textAlign: "center",
                letterSpacing: "0.02em",
              }}>
                {l.code}
              </div>
              <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.5 }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChapterMap({ chapters, level, lang, user, onSelect, onSignOut }) {
  const visibleChapters = chapters.filter(ch => {
    if (level?.code === "A1") return ch.id >= 1 && ch.id <= 8;
    if (level?.code === "A2") return ch.id >= 9 && ch.id <= 16;
    if (level?.code === "B1") return ch.id >= 17 && ch.id <= 24;
    return true;
  });
  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          {user?.user_metadata?.first_name && (
            <div style={{ fontSize: "0.78rem", color: C.muted, marginBottom: "0.2rem" }}>Welcome back, {user.user_metadata.first_name}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
            <span style={{ fontFamily: serif, fontSize: "1.6rem", fontWeight: 600, color: C.text }}>{lang?.name}</span>
            <span style={{
              background: C.greenLight,
              color: C.green,
              fontWeight: 700,
              fontSize: "0.82rem",
              padding: "0.2rem 0.65rem",
              borderRadius: 6,
              letterSpacing: "0.03em",
            }}>
              {level?.code}
            </span>
          </div>
          <div style={{ color: C.soft, fontSize: "0.875rem" }}>{level?.desc}</div>
        </div>
        <button
          onClick={onSignOut}
          style={{ background: "none", border: "none", color: C.muted, fontSize: "0.78rem", cursor: "pointer", fontFamily: sans, paddingTop: "0.35rem" }}
          onMouseEnter={e => (e.currentTarget.style.color = C.soft)}
          onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
        >
          Sign out
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {visibleChapters.map((ch, i) => {
          const pct = ch.total ? ch.done / ch.total : 0;
          const complete = pct >= 1;
          const inProgress = pct > 0 && pct < 1;
          return (
            <button
              key={ch.id}
              onClick={() => onSelect(ch)}
              style={{
                background: complete ? C.greenLight : C.surface,
                border: `1.5px solid ${complete ? "#B0CEBC" : C.border}`,
                borderRadius: 12,
                padding: "1.1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: sans,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.boxShadow = "0 3px 14px rgba(43,95,71,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = complete ? "#B0CEBC" : C.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                <div style={{ fontWeight: 600, color: C.muted, fontSize: "0.78rem", minWidth: 32, textAlign: "center" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ background: C.greenLight, color: C.green, fontWeight: 700, fontSize: "0.65rem", borderRadius: 4, padding: "0.1rem 0.4rem", letterSpacing: "0.03em" }}>
                  {level?.code}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: C.text, fontSize: "0.95rem", marginBottom: "0.15rem" }}>{ch.theme}</div>
                <div style={{ fontSize: "0.78rem", color: C.soft, marginBottom: "0.6rem" }}>{ch.grammar}</div>
                <div style={{ background: C.border, borderRadius: 4, height: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: C.green,
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
              <div style={{
                fontSize: "0.78rem",
                fontWeight: complete ? 600 : 400,
                color: complete ? C.green : C.muted,
                flexShrink: 0,
              }}>
                {complete
                  ? <span
                      onMouseEnter={e => (e.currentTarget.textContent = "↺ Retake")}
                      onMouseLeave={e => (e.currentTarget.textContent = "✓ Done")}
                    >✓ Done</span>
                  : inProgress ? `${ch.done}/${ch.total}` : `0/${ch.total}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseView({ s, chapter, sIdx, total, input, setInput, submitted, correct, exact, typo, prefixMatch, inputColor, showTrans, setShowTrans, onSubmit, onNext, onSaveWord, onGrammarDoubleClick, showHint, onDismissHint, onBack }) {
  const pct = total > 0 ? (sIdx / total) : 0;
  const isMobile = window.matchMedia?.("(hover: none)")?.matches ?? false;
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", minHeight: "calc(100vh - 62px)", display: "flex", flexDirection: "column" }}>

      {/* Top progress bar */}
      <div style={{ height: 3, background: C.border, width: "100%", flexShrink: 0 }}>
        <div style={{
          height: "100%",
          width: `${pct * 100}%`,
          background: C.green,
          borderRadius: "0 2px 2px 0",
          transition: "width 0.4s ease",
        }} />
      </div>

      <div style={{ padding: "2.5rem 1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>

      {/* Chapter header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.75rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.soft, fontSize: "0.875rem", cursor: "pointer", fontFamily: sans, padding: 0, paddingTop: "0.15rem", flexShrink: 0 }}>← Back</button>
          <div>
            <div style={{ fontFamily: serif, fontWeight: 600, color: C.text, fontSize: "1.05rem", marginBottom: "0.2rem" }}>
              {chapter?.theme}
            </div>
            <div style={{ fontSize: "0.78rem", color: C.soft }}>{chapter?.grammar}</div>
          </div>
        </div>
        <div style={{ fontSize: "0.82rem", color: C.muted, flexShrink: 0, paddingTop: "0.2rem" }}>
          {sIdx + 1} / {total}
        </div>
      </div>

      {/* Two-column layout (single column on mobile) */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "2.5rem", alignItems: "flex-start", flex: 1 }}>

        {/* Left: Sentence + interaction */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Sentence */}
          <div style={{
            fontFamily: serif,
            fontSize: "1.75rem",
            lineHeight: 1.7,
            color: C.text,
            marginBottom: "1.75rem",
            letterSpacing: "-0.01em",
          }}>
            <WordSpan text={s.before + " "} onSave={onSaveWord} />
            {submitted ? (
              <span style={{
                color: correct ? C.correct : C.wrong,
                borderBottom: `2.5px solid ${correct ? C.correct : C.wrong}`,
                fontStyle: "italic",
                padding: "0 4px",
              }}>
                {s.answer}
              </span>
            ) : (
              <span style={{
                display: "inline-block",
                borderBottom: `2.5px dashed ${C.green}`,
                minWidth: "5rem",
                marginBottom: "-2px",
                position: "relative",
              }}>
                <span style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "-0.1em",
                  fontSize: "0.55em",
                  color: C.greenMid,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "sans-serif",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                }}>fill in</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            )}
            {" "}<WordSpan text={s.after} onSave={onSaveWord} />
          </div>

          {/* Translation toggle */}
          <div style={{ marginBottom: "1.5rem" }}>
            <button
              onClick={() => setShowTrans(v => !v)}
              style={{
                background: "none",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "0.38rem 0.85rem",
                fontSize: "0.78rem",
                color: C.soft,
                cursor: "pointer",
                fontFamily: sans,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.green)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              {showTrans ? "Hide translation" : "Show translation"}
            </button>
            {showTrans && (
              <div style={{ color: C.soft, fontStyle: "italic", fontSize: "0.9rem", marginTop: "0.65rem", lineHeight: 1.6 }}>
                {s.naturalTranslation ?? s.translation}
              </div>
            )}
          </div>

          {/* Input or result */}
          {!submitted ? (
            <div style={{ display: "flex", gap: "0.65rem" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && input.trim()) onSubmit(); }}
                placeholder="Type the missing word..."
                autoFocus
                style={{
                  flex: 1,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  fontFamily: sans,
                  outline: "none",
                  background: C.surface,
                  color: inputColor,
                  fontWeight: prefixMatch ? 600 : 400,
                  transition: "border-color 0.15s, color 0.1s",
                }}
                onFocus={e => (e.target.style.borderColor = C.green)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={onSubmit}
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? C.green : C.border,
                  color: input.trim() ? "#fff" : C.muted,
                  border: "none",
                  borderRadius: 8,
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.9rem",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  fontFamily: sans,
                  fontWeight: 500,
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                Check
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                background: correct ? C.correctLight : C.wrongLight,
                border: `1.5px solid ${correct ? C.correct : C.wrong}`,
                borderRadius: 8,
                padding: "0.85rem 1rem",
                color: correct ? C.correct : C.wrong,
                fontWeight: 500,
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}>
                {exact && "✓ Correct"}
                {typo && (
                  <span>
                    ✓ Close enough!{" "}
                    <span style={{ fontWeight: 400 }}>
                      The exact form is{" "}
                      <span style={{ fontStyle: "italic", fontWeight: 600 }}>{s.answer}</span>
                    </span>
                  </span>
                )}
                {!correct && (
                  <div>
                    <div style={{ marginBottom: "0.5rem" }}>✗ The answer is: <span style={{ fontStyle: "italic", fontWeight: 600 }}>{s.answer}</span></div>
                    <div style={{ fontWeight: 400, fontSize: "0.85rem", opacity: 0.85, lineHeight: 1.5 }}>{s.grammarShort}</div>
                  </div>
                )}
              </div>
              <Btn onClick={onNext}>Next →</Btn>
            </div>
          )}

          {/* First-use hint — desktop only */}
          {showHint && !isMobile && (
            <div style={{
              marginTop: "1.75rem",
              background: C.amberLight,
              border: `1px solid #E0C080`,
              borderRadius: 10,
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "1.1rem" }}>💡</span>
                <span style={{ fontSize: "0.82rem", color: C.amber, lineHeight: 1.5 }}>
                  <strong>Tip:</strong> Double-click any word in the sentence to save it to your flashcard deck.
                </span>
              </div>
              <button
                onClick={onDismissHint}
                style={{
                  background: "none",
                  border: "none",
                  color: C.amber,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: "0.2rem",
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              >✕</button>
            </div>
          )}
        </div>

      </div>{/* end padding wrapper */}

        {/* Right: Grammar Panel — desktop sidebar / mobile inline card */}
        {isMobile ? (
          <div style={{
            background: C.greenLight,
            border: `1px solid #C0D8CA`,
            borderRadius: 10,
            padding: "0.85rem 1rem",
            marginTop: "1.25rem",
          }}>
            <div style={{ fontFamily: serif, fontWeight: 600, fontSize: "0.92rem", color: C.text, marginBottom: "0.35rem" }}>
              {s.grammarLabel}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#3C6B53", lineHeight: 1.6 }}>
              {s.grammarShort}
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 210,
              flexShrink: 0,
              background: C.greenLight,
              border: `1px solid #C0D8CA`,
              borderRadius: 14,
              padding: "1.35rem 1.25rem",
              position: "sticky",
              top: "1.5rem",
            }}
          >
            <div style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: C.greenMid,
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}>
              Grammar
            </div>
            <div
              onDoubleClick={onGrammarDoubleClick}
              title="Double-click for full overview"
              style={{
                fontFamily: serif,
                fontWeight: 600,
                fontSize: "1.05rem",
                color: C.text,
                marginBottom: "0.85rem",
                lineHeight: 1.35,
                cursor: "default",
                borderBottom: `1px dashed #B0CEBC`,
                paddingBottom: "0.85rem",
              }}
            >
              {s.grammarLabel}
            </div>
            <div style={{
              fontSize: "0.825rem",
              color: "#3C6B53",
              lineHeight: 1.65,
              marginBottom: "1.25rem",
            }}>
              {s.grammarShort}
            </div>
            <button
              onDoubleClick={onGrammarDoubleClick}
              onClick={onGrammarDoubleClick}
              style={{
                background: "none",
                border: `1px solid #B0CEBC`,
                borderRadius: 6,
                padding: "0.38rem 0.75rem",
                fontSize: "0.72rem",
                color: C.greenMid,
                cursor: "pointer",
                fontFamily: sans,
                width: "100%",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,95,71,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Full overview →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getDueCards(cards) {
  const now = new Date();
  const due = cards.filter(c => !c.retired && new Date(c.due_date) <= now);
  if (due.length > 0) return due;
  const active = cards.filter(c => !c.retired);
  if (active.length === 0) return [];
  return [active.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]];
}

function FlashcardDeck({ cards, onDelete, onRate }) {
  const [mode, setMode] = useState("deck"); // deck | review
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const activeCards = cards.filter(c => !c.retired);
  const dueCards = getDueCards(cards);

  function startReview() {
    setQueue(getDueCards(cards));
    setQueueIdx(0);
    setFlipped(false);
    setMode("review");
  }

  function nextCard() {
    setQueueIdx(i => i + 1);
    setFlipped(false);
  }

  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center", fontFamily: sans }}>
        <div style={{ fontFamily: serif, fontSize: "1.4rem", color: C.text, marginBottom: "0.75rem" }}>Your deck is empty</div>
        <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7 }}>
          Double-click any word in a sentence to save it here. Each card keeps the original sentence as context.
        </div>
      </div>
    );
  }

  if (mode === "review") {
    if (activeCards.length === 0) {
      return (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center", fontFamily: sans }}>
          <div style={{ fontFamily: serif, fontSize: "1.4rem", color: C.text, marginBottom: "0.75rem" }}>All retired</div>
          <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Every card has been marked as too easy. Keep adding words from the exercises.
          </div>
          <Btn onClick={() => setMode("deck")} variant="ghost">Back to deck</Btn>
        </div>
      );
    }

    // Queue exhausted — all caught up
    if (queueIdx >= queue.length) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dueTomorrow = activeCards.filter(c => new Date(c.due_date) < tomorrow).length;
      return (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center", fontFamily: sans }}>
          <div style={{ fontFamily: serif, fontSize: "1.4rem", color: C.green, marginBottom: "0.5rem" }}>All caught up!</div>
          <div style={{ color: C.soft, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            {dueTomorrow > 0 ? `${dueTomorrow} card${dueTomorrow === 1 ? "" : "s"} due tomorrow.` : "Nothing due tomorrow either. Keep adding words."}
          </div>
          <Btn onClick={() => setMode("deck")} variant="ghost">Back to deck</Btn>
        </div>
      );
    }

    const current = queue[queueIdx];
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem 1.5rem", fontFamily: sans }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <button
            onClick={() => setMode("deck")}
            style={{ background: "none", border: "none", color: C.soft, cursor: "pointer", fontFamily: sans, fontSize: "0.875rem" }}
          >
            ← Back to deck
          </button>
          <span style={{ color: C.muted, fontSize: "0.82rem" }}>{queueIdx + 1} / {queue.length}</span>
        </div>

        {/* Card */}
        <div
          onClick={() => setFlipped(v => !v)}
          style={{
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 16,
            padding: "3.5rem 2rem",
            textAlign: "center",
            cursor: "pointer",
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            marginBottom: "1.5rem",
            transition: "box-shadow 0.15s",
            userSelect: "none",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)")}
        >
          {!flipped ? (
            <div style={{ fontFamily: serif, fontSize: "2.25rem", color: C.text }}>{current.word}</div>
          ) : (
            <>
              <div style={{ fontFamily: serif, fontSize: "1.5rem", fontWeight: 600, color: C.text, marginBottom: "1.25rem" }}>
                {current.wordTranslation || "—"}
              </div>
              <div style={{ fontSize: "0.88rem", color: C.text, lineHeight: 1.7, marginBottom: "0.4rem" }}>
                {current.contextGreek || current.context?.replace("___", current.word)}
              </div>
              <div style={{ fontSize: "0.82rem", color: C.soft, fontStyle: "italic", lineHeight: 1.65, marginBottom: "0.25rem" }}>
                {current.contextEnglish || current.translation}
              </div>
              {current.chapter && (
                <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: "0.5rem" }}>{current.chapter}</div>
              )}
            </>
          )}
        </div>

        {flipped && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "Hard",   rating: 1, primary: false },
                { label: "Medium", rating: 3, primary: false },
                { label: "Easy",   rating: 4, primary: true  },
              ].map(({ label, rating, primary }) => (
                <button
                  key={label}
                  onClick={() => { onRate(current, rating); nextCard(); }}
                  style={{
                    flex: 1,
                    padding: "0.7rem",
                    borderRadius: 8,
                    border: `1.5px solid ${primary ? C.green : C.border}`,
                    background: primary ? C.green : C.surface,
                    color: primary ? "#fff" : C.text,
                    fontFamily: sans,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "opacity 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { onRate(current, 5); nextCard(); }}
              style={{
                width: "100%",
                padding: "0.55rem",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "none",
                color: C.muted,
                fontFamily: sans,
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
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

  // Deck list view
  const dueCount = dueCards.length;
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem 1.5rem", fontFamily: sans }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: "1.5rem", fontWeight: 600, color: C.text }}>Your Deck</div>
          <div style={{ fontSize: "0.8rem", color: C.soft, marginTop: "0.2rem" }}>{cards.length} {cards.length === 1 ? "word" : "words"} saved</div>
        </div>
        <Btn onClick={startReview} small style={dueCount === 0 ? { color: C.muted } : {}}>
          {`Review (${dueCount} due)`}
        </Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {cards.map(card => (
          <div
            key={card.word}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "0.9rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontWeight: 600, color: C.text, fontSize: "1.05rem" }}>{card.word}</div>
              <div style={{ fontSize: "0.78rem", color: C.soft, marginTop: "0.2rem", fontStyle: "italic" }}>{card.contextGreek || card.context?.replace("___", card.word)}</div>
              {card.chapter && (
                <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: "0.15rem" }}>{card.chapter}</div>
              )}
            </div>
            <button
              onClick={() => onDelete(card.word)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.9rem", padding: "0.25rem", lineHeight: 1 }}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | language | level | chapters | exercise
  const [lang, setLang] = useState(null);
  const [level, setLevel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [sIdx, setSIdx] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showTrans, setShowTrans] = useState(false);
  const [grammarModal, setGrammarModal] = useState(false);
  const [flashcards, setFlashcards] = useState(null); // null = loading
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("home");
  const [showHint, setShowHint] = useState(true);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({}); // keyed by chapter_id
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out

  // Auth: check existing session on mount, then subscribe to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setFlashcards(null);
        setProgress({});
        setSentences([]);
        setLang(null);
        setLevel(null);
        setScreen("welcome");
        localStorage.removeItem("glossa_lang");
        localStorage.removeItem("glossa_level");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore session from localStorage after auth resolves
  useEffect(() => {
    if (user === undefined || user === null) return;
    try {
      const savedLang = localStorage.getItem("glossa_lang");
      const savedLevel = localStorage.getItem("glossa_level");
      if (savedLang && savedLevel) {
        setLang(JSON.parse(savedLang));
        setLevel(JSON.parse(savedLevel));
        setScreen("chapters");
      }
    } catch {}
  }, [user?.id]);

  // Persist lang/level to localStorage whenever they change
  useEffect(() => { if (lang) localStorage.setItem("glossa_lang", JSON.stringify(lang)); }, [lang]);
  useEffect(() => { if (level) localStorage.setItem("glossa_level", JSON.stringify(level)); }, [level]);

  const s = sentences[sIdx % Math.max(sentences.length, 1)];

  // Load flashcards whenever the authenticated user changes
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("flashcards")
      .select("*")
      .eq("session_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.warn("[flashcards] load error:", error.message); setFlashcards([]); return; }
        setFlashcards(data ?? []);
      });
  }, [user?.id]);

  // Load progress from Supabase whenever the chapter map is shown
  useEffect(() => {
    if (screen !== "chapters" || !user?.id) return;
    const levelCode = level?.code ?? "A1";
    supabase
      .from("user_progress")
      .select("chapter_id, completed_sentences, total_sentences")
      .eq("session_id", user.id)
      .eq("level", levelCode)
      .then(({ data, error }) => {
        if (error) { console.warn("[progress] load error:", error.message); return; }
        const map = {};
        (data ?? []).forEach(r => { map[r.chapter_id] = { done: r.completed_sentences, total: r.total_sentences }; });
        setProgress(map);
      });
  }, [screen, level, user?.id]);

  // Greek-aware normalization: strip accents, collapse homophones
  // Handles: accent marks, ω/ο, η/ι/υ/οι/ει (all sound like "i"), final σ/ς
  function normalize(str) {
    return str
      .trim()
      .toLowerCase()
      // Strip Greek accent marks via Unicode decomposition
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .normalize("NFC")
      // Collapse homophones — all sound like "i" in modern Greek
      .replace(/[ηυ]/g, "ι")
      .replace(/οι|ει/g, "ι")
      // Collapse ω → ο (both sound the same in modern Greek)
      .replace(/ω/g, "ο")
      // Normalize final sigma ς → σ
      .replace(/ς/g, "σ");
  }

  // Levenshtein distance for typo tolerance
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  const inputNorm = normalize(input);
  const answerNorm = s ? normalize(s.answer) : "";
  const exact = inputNorm === answerNorm;
  const dist = s ? levenshtein(inputNorm, answerNorm) : 99;
  const typo = !exact && dist <= 1;
  const correct = exact || typo;

  // Prefix match for green typing
  const prefixMatch = answerNorm.startsWith(inputNorm) && inputNorm.length > 0;
  const inputColor = input.length === 0 ? C.text : prefixMatch ? C.correct : C.text;

  function fireToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function saveWord(word) {
    if (!word || word.length < 2) return;
    if ((flashcards ?? []).find(f => f.word === word)) {
      fireToast(`"${word}" is already in your deck`);
      return;
    }
    const newCard = {
      session_id: user.id,
      word,
      wordTranslation: "…",
      contextGreek: `${s.before} ${word} ${s.after}`.trim(),
      contextEnglish: s.naturalTranslation ?? s.translation ?? "",
      translation: s.naturalTranslation ?? s.translation ?? "",
      context: `${s.before} ___ ${s.after}`,
      chapter: chapter?.theme ?? "",
      ease_factor: 2.5,
      interval: 1,
      repetitions: 0,
      retired: false,
      due_date: new Date().toISOString(),
    };
    // Optimistic update with placeholder
    setFlashcards(prev => [...(prev ?? []), newCard]);
    fireToast(`"${word}" saved to flashcards ✓`);
    supabase
      .from("flashcards")
      .insert(newCard)
      .then(({ error }) => {
        if (error) console.warn("[flashcards] save error:", error.message);
      });

    // Background: look up per-word translation, then patch local state + Supabase
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (res.ok) {
        const { translation: wordTranslation } = await res.json();
        setFlashcards(prev => (prev ?? []).map(c =>
          c.word === word ? { ...c, wordTranslation } : c
        ));
        supabase
          .from("flashcards")
          .update({ wordTranslation })
          .eq("session_id", user.id)
          .eq("word", word)
          .then(({ error }) => {
            if (error) console.warn("[flashcards] wordTranslation update error:", error.message);
          });
      }
    } catch (err) {
      console.warn("[saveWord] translation lookup failed:", err.message);
    }
  }

  async function goToExercise(ch) {
    setChapter(ch);
    setSIdx(0);
    setInput("");
    setSubmitted(false);
    setShowTrans(false);
    setSentences([]);
    setLoading(true);
    setScreen("exercise");
    try {
      const levelCode = level?.code ?? "A1";

      // 1. Check Supabase cache
      const { data: cached, error: cacheErr } = await supabase
        .from("sentences")
        .select("sentences")
        .eq("chapter_id", ch.id)
        .eq("level", levelCode)
        .maybeSingle();

      if (cacheErr) console.warn("[goToExercise] cache read error:", cacheErr.message);

      if (cached) {
        setSentences(cached.sentences);
        return;
      }

      // 2. Cache miss — generate via Claude API
      const prompt = CHAPTER_PROMPTS[ch.id] ?? buildChapterPrompt(ch);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterPrompt: prompt }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      // 3. Write to cache (fire-and-forget — don't block rendering on this)
      supabase
        .from("sentences")
        .insert({ chapter_id: ch.id, level: levelCode, sentences: data })
        .then(({ error }) => {
          if (error) console.warn("[goToExercise] cache write error:", error.message);
        });

      setSentences(data);
    } catch (err) {
      console.error("[goToExercise]", err);
    } finally {
      setLoading(false);
    }
  }

  function writeProgress(chapterId, completedCount) {
    const levelCode = level?.code ?? "A1";
    supabase
      .from("user_progress")
      .upsert(
        {
          session_id: user.id,
          chapter_id: chapterId,
          level: levelCode,
          completed_sentences: completedCount,
          total_sentences: sentences.length || 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id,chapter_id,level" }
      )
      .then(({ error }) => {
        if (error) console.warn("[progress] write error:", error.message);
      });
  }

  function handleNext() {
    const nextIdx = sIdx + 1;
    // Write progress after each completed sentence
    writeProgress(chapter?.id, nextIdx);

    if (sIdx < sentences.length - 1) {
      setSIdx(nextIdx);
      setInput("");
      setSubmitted(false);
      setShowTrans(false);
    } else {
      setScreen("complete");
    }
  }

  // Auth guard
  if (user === undefined) return null; // still checking session
  if (user === null) return <AuthScreen />;

  // Pre-chapter screens (no nav)
  if (screen === "welcome") return <Welcome onStart={() => setScreen("language")} />;
  if (screen === "language") return <LanguagePicker onSelect={l => { setLang(l); setScreen("level"); }} onBack={() => setScreen("welcome")} />;
  if (screen === "level") return <LevelPicker onSelect={l => { setLevel(l); setScreen("chapters"); setTab("home"); }} onBack={() => setScreen("language")} />;

  // Main app shell
  return (
    <div style={{ fontFamily: sans, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: C.text,
          color: "#fff",
          padding: "0.6rem 1.35rem",
          borderRadius: 30,
          fontSize: "0.82rem",
          zIndex: 9999,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}

      {/* Grammar Modal */}
      {grammarModal && s && (
        <div
          onClick={() => setGrammarModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000,
            padding: "1.5rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: "2.25rem",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", color: C.green, textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Grammar Overview
            </div>
            <div style={{ fontFamily: serif, fontSize: "1.4rem", fontWeight: 600, color: C.text, marginBottom: "0.75rem", lineHeight: 1.3 }}>
              {s.grammarLabel}
            </div>
            <div style={{ fontFamily: serif, fontSize: "0.92rem", color: C.soft, fontStyle: "italic", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              {s.before} <strong style={{ fontStyle: "normal", color: C.green }}>{s.answer}</strong> {s.after}
            </div>
            <p style={{ color: C.soft, lineHeight: 1.75, fontSize: "0.92rem", marginBottom: "1.75rem" }}>
              {s.grammarFull ?? s.grammarShort}
            </p>
            <Btn onClick={() => setGrammarModal(false)}>Got it</Btn>
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "home" && screen === "chapters" && (
          <ChapterMap
            chapters={CHAPTERS.map(ch => ({
              ...ch,
              done:  progress[ch.id]?.done  ?? 0,
              total: progress[ch.id]?.total ?? 10,
            }))}
            level={level}
            lang={lang}
            user={user}
            onSelect={goToExercise}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
        {tab === "home" && screen === "complete" && (
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center", fontFamily: sans }}>
            <div style={{ fontFamily: serif, fontSize: "1.75rem", fontWeight: 600, color: C.green, marginBottom: "0.5rem" }}>Chapter complete</div>
            <div style={{ fontFamily: serif, fontSize: "1.1rem", color: C.text, marginBottom: "0.5rem" }}>{chapter?.theme}</div>
            <div style={{ fontSize: "0.88rem", color: C.muted, marginBottom: "3rem" }}>{sentences.length} sentences finished</div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => { setScreen("chapters"); setTab("home"); }}>Back to chapters</Btn>
              <Btn onClick={() => { setSIdx(0); setInput(""); setSubmitted(false); setShowTrans(false); setScreen("exercise"); }}>↺ Retake chapter</Btn>
            </div>
          </div>
        )}
        {tab === "home" && screen === "exercise" && loading && (
          <LoadingScreen />
        )}
        {tab === "home" && screen === "exercise" && !loading && !s && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 62px)", fontFamily: sans, color: C.soft, fontSize: "0.95rem", gap: "1rem" }}>
            <div>Could not load sentences.</div>
            <Btn variant="ghost" onClick={() => { setScreen("chapters"); setTab("home"); }}>← Back to chapters</Btn>
          </div>
        )}
        {tab === "home" && screen === "exercise" && !loading && s && (
          <ExerciseView
            s={s}
            chapter={chapter}
            sIdx={sIdx}
            total={sentences.length}
            input={input}
            setInput={setInput}
            submitted={submitted}
            correct={correct}
            exact={exact}
            typo={typo}
            prefixMatch={prefixMatch}
            inputColor={inputColor}
            showTrans={showTrans}
            setShowTrans={setShowTrans}
            onSubmit={() => setSubmitted(true)}
            onNext={handleNext}
            onSaveWord={saveWord}
            onGrammarDoubleClick={() => setGrammarModal(true)}
            showHint={showHint}
            onDismissHint={() => setShowHint(false)}
            onBack={() => { setScreen("chapters"); setTab("home"); }}
          />
        )}
        {tab === "flashcards" && (
          <FlashcardDeck
            cards={flashcards ?? []}
            onDelete={word => {
              setFlashcards(f => (f ?? []).filter(c => c.word !== word));
              supabase
                .from("flashcards")
                .delete()
                .eq("session_id", user.id)
                .eq("word", word)
                .then(({ error }) => { if (error) console.warn("[flashcards] delete error:", error.message); });
            }}
            onRate={(card, rating) => {
              const updates = sm2(card, rating);
              setFlashcards(f => (f ?? []).map(c => c.word === card.word ? { ...c, ...updates } : c));
              supabase
                .from("flashcards")
                .update(updates)
                .eq("session_id", user.id)
                .eq("word", card.word)
                .then(({ error }) => { if (error) console.warn("[flashcards] rate error:", error.message); });
            }}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        flexShrink: 0,
      }}>
        {[
          { key: "home", icon: "❖", label: "Chapters" },
          { key: "flashcards", icon: "⊞", label: (flashcards ?? []).length > 0 ? `Cards (${(flashcards ?? []).length})` : "Cards" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === "home") setScreen("chapters");
            }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.7rem 0.5rem",
              color: tab === t.key ? C.green : C.muted,
              fontFamily: sans,
              fontSize: "0.78rem",
              fontWeight: tab === t.key ? 600 : 400,
              transition: "color 0.15s",
              borderTop: tab === t.key ? `2px solid ${C.green}` : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: "1rem" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
