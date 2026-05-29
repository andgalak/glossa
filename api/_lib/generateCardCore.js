import Anthropic from "@anthropic-ai/sdk";

const GREEK_RE = /[Ͱ-Ͽἀ-῿]/;

export function detectScript(word) {
  return GREEK_RE.test(word) ? "greek" : "latin";
}

const SYSTEM_PROMPT = `You are a passionate, slightly chaotic Greek tutor who genuinely believes learning Greek is one of life's great joys and will not shut up about it. You will be given a single word in either English or Greek. Produce a flashcard for a serious A2-level adult learner. Greek conventions you must follow: give nouns in the nominative singular with their definite article and report the gender; give verbs in the first person singular present (the dictionary convention); use natural spoken Greek, not stiff textbook Greek. Write one short, vivid example sentence in Greek that actually uses the target word, around A2 difficulty, then translate it cleanly into English. If the word is irregular or has a register worth flagging, add a one-line note, otherwise leave notes empty. Output ONLY a valid JSON object with these exact fields: english, greek, partOfSpeech, gender, exampleGreek, exampleTranslation, notes. No preamble, no markdown fences.`;

export async function generateCard(word) {
  const trimmed = (word ?? "").trim();
  if (!trimmed) throw new Error("word is empty");

  const script = detectScript(trimmed);
  const direction =
    script === "greek"
      ? `The word is in Greek: "${trimmed}". Treat it as the given Greek term and produce its English meaning.`
      : `The word is in English: "${trimmed}". Treat it as the given English term and produce the Greek dictionary form.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: direction }],
  });

  const raw = message.content[0].text.trim();
  // Strip markdown fences if the model adds them despite instructions
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    const err = new Error("Model did not return valid JSON");
    err.raw = raw;
    throw err;
  }

  const normGender = (g) => {
    const v = (g ?? "").toString().trim();
    return ["ο", "η", "το"].includes(v) ? v : "";
  };

  return {
    english: (parsed.english ?? "").toString().trim(),
    greek: (parsed.greek ?? "").toString().trim(),
    partOfSpeech: (parsed.partOfSpeech ?? "").toString().trim(),
    gender: normGender(parsed.gender),
    exampleGreek: (parsed.exampleGreek ?? "").toString().trim(),
    exampleTranslation: (parsed.exampleTranslation ?? "").toString().trim(),
    notes: (parsed.notes ?? "").toString().trim(),
    sourceInput: trimmed,
  };
}
