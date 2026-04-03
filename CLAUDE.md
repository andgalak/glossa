# Glōssa — Claude Code Project Instructions

## What this is

A Greek language learning app for serious adult learners. CEFR-structured cloze sentence exercises (A1 through B2+), a right-side grammar panel on every sentence, double-click any word to save it to a personal flashcard deck, and an SM-2 spaced repetition review mode. No streaks, no gamification, no nonsense. Built for people who find Duolingo insulting. The product respects their intelligence.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Styling | Inline styles with design tokens (see prototype) |
| Database + Auth | Supabase (Postgres) |
| Hosting | Vercel |
| AI | Claude API — **Haiku only**, never Sonnet |
| Fonts | Lora (serif) + DM Sans (sans) via Google Fonts |

No additional libraries unless explicitly requested. Do not introduce Tailwind, MUI, Chakra, styled-components, or any component library.

---

## Design Tokens

These are fixed. Do not invent new colors or alter the palette.

```js
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
```

---

## Build Order

Work strictly in this sequence. Flag any suggestion that adds scope before step 7.

1. **Grammar note prompts** — finalize short panel version and long modal version
2. **Scaffold** — project structure from prototype JSX, confirms it runs
3. **Claude API call** — end to end with hardcoded chapter prompt, sentences render in exercise view, no Supabase yet
4. **Supabase sentence caching** — generated batches write to DB, app reads from DB, regenerates when pool runs low, never calls API on every page load
5. **Chapter map** — real navigation and progress tracking wired to Supabase
6. **Flashcard save, deck view, and SM-2 review loop**
7. **Auth** — user accounts, progress and flashcards tied to a user
8. **All A1 and A2 chapter prompt templates**
9. **Polish** — correct/incorrect states, grammar modal, translation toggle all feeling tight
10. **One real user** — watch where they get confused, fix what is broken, cut what is unnecessary
11. **Vercel deployment + real domain**
12. **Charge someone**

---

## Sentence Generation

### Batching and caching rules
- Generate **30 sentences per chapter**, cached in Supabase on first open
- App always reads from cache
- Regenerate when pool drops below a threshold (decide threshold at step 4)
- **Never call the Claude API on every page load**
- Model: `claude-haiku-4-5-20251001`

### Generation prompt template

```
You are a passionate, slightly chaotic Greek tutor who genuinely believes learning Greek is one of life's great joys and will not shut up about it. Generate 10 cloze sentences for A1 learners where the blank always tests a present tense verb. Theme: greetings and introductions. Greek sentence first, always. Natural street Greek, not textbook Greek. Output ONLY a valid JSON array with these exact fields: before, answer, after, naturalTranslation, gloss, greekGrammarTags, englishGrammarTags, grammarLabel, grammarShort. No preamble, no markdown fences.
```

### JSON schema

```json
{
  "before": "Greek text before the blank",
  "answer": "the missing word",
  "after": "Greek text after the blank",
  "naturalTranslation": "clean English translation",
  "gloss": "word-for-word gloss in Greek word order",
  "greekGrammarTags": ["tag1", "tag2"],
  "englishGrammarTags": ["tag1", "tag2"],
  "grammarLabel": "short name e.g. Present Subjunctive",
  "grammarShort": "one or two sentence explanation for the grammar panel"
}
```

---

## Input Matching

Greek keyboard input only. No Latin transliteration accepted.

Normalize both input and answer before any comparison:
1. Strip accent marks via Unicode NFD decomposition, remove `\u0300–\u036f`, re-normalize to NFC
2. Collapse `ω → ο`
3. Collapse `η`, `υ`, `οι`, `ει` → `ι`
4. Normalize final `ς → σ`

Levenshtein threshold: **1**. Typo is accepted as correct, but the exact form is shown in feedback.

Input turns green in real time as each typed character matches the answer prefix (post-normalization).

---

## UX — Decisions Already Made

Do not re-open these. If something here conflicts with a new idea, flag it rather than silently overriding it.

- One sentence at a time, full screen focus
- Thin green progress bar across the very top of the exercise screen
- Grammar panel on the right of the exercise view, always visible
- Blank rendered as green dashed underline with small "fill in" label
- Double-click the grammar label or "Full overview →" button to open grammar modal
- Grammar note shown in feedback after a wrong answer — not just the correct word
- Double-click any word in the sentence to save it to the flashcard deck
- First-use amber tip banner explaining double-click, dismissable with ✕
- Flashcard deck view + SM-2 spaced repetition review mode
- Two nav tabs: Chapters and Cards
- Onboarding flow: welcome → language picker → level picker → chapter map
- No streaks, no XP, no gamification of any kind

---

## Chapter Structure (A1 Greek)

| # | Theme | Grammar Focus |
|---|---|---|
| 1 | Greetings & Introductions | To Be, Personal Pronouns |
| 2 | Numbers & Time | Cardinal Numbers, Clock |
| 3 | Food & Drink | Indefinite Article, Basic Verbs |
| 4 | Family | Possessives, Noun Gender |
| 5 | Getting Around | Imperatives, Prepositions |
| 6 | Shopping | Accusative Case Basics |
| 7 | Home & Rooms | Locatives, Adjective Agreement |
| 8 | Daily Routine | Present Tense Verb Conjugation |

---

## Supabase Schema (to be created at step 4)

Tables needed:
- `sentences` — cached generated sentences, keyed by chapter + level
- `user_progress` — per-user, per-chapter exercise progress
- `flashcards` — per-user saved words with context and chapter

Auth: Supabase email/password. Add social login only if explicitly requested.

---

## What Not To Do

- Do not add scope before step 7
- Do not call the Claude API on every sentence load
- Do not use Sonnet — Haiku only for generation
- Do not add gamification (streaks, XP, badges, leaderboards, etc.)
- Do not add other languages — they are stubbed as "coming soon" until explicitly unlocked
- Do not introduce new dependencies without asking first
- Do not alter the color palette or font choices
- Do not add Latin transliteration input support

---

## File Structure (target)

```
glossa/
├── CLAUDE.md
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── ExerciseView.jsx
│   │   ├── ChapterMap.jsx
│   │   ├── FlashcardDeck.jsx
│   │   ├── GrammarModal.jsx
│   │   └── WordSpan.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── claude.js        ← generation calls, nothing else
│   │   ├── matching.js      ← normalize + levenshtein
│   │   └── sm2.js           ← spaced repetition algorithm
│   ├── data/
│   │   ├── chapters.js
│   │   └── prompts.js       ← one prompt template per chapter
│   └── tokens.js            ← design tokens (C, serif, sans)
├── .env.local               ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
└── vite.config.js
```

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=        ← server-side only, never exposed to client
```

The Claude API key must never be included in client-side code. Route generation calls through a Supabase Edge Function or Vercel serverless function.
