import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a precise Greek reading tutor. You are given one Greek word and the full sentence it appears in. Return the word's dictionary (lemma) form, its meaning in this specific context, and one short grammar note about the form as it appears here.

Rules:
- dictionary: the lemma a learner would look up. Verbs -> first person singular present (e.g. πήγα -> πηγαίνω). Nouns -> nominative singular with its definite article and correct gender (e.g. θάλασσας -> η θάλασσα). Adjectives -> masculine nominative singular. If the word is already a lemma, repeat it.
- meaning: the meaning in THIS sentence, 1 to 5 English words, no punctuation.
- grammar: one short clause naming the form as it appears here (e.g. "aorist, 1st person singular", "genitive singular"), or "" if nothing is noteworthy.

Output ONLY a valid JSON object with exactly these fields: dictionary, meaning, grammar. No preamble, no markdown fences.`;

// Given a tapped word and its sentence, return { dictionary, meaning, grammar }.
export async function translateInContext(word, sentence) {
  const w = (word ?? "").toString().trim();
  if (!w) throw new Error("word is empty");
  const s = (sentence ?? "").toString().trim() || w;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Word: "${w}"\nSentence: "${s}"` },
    ],
  });

  const raw = message.content[0].text.trim();
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    // Fall back to the bare word so the UI still shows something useful.
    parsed = { dictionary: w, meaning: raw.slice(0, 40), grammar: "" };
  }

  return {
    dictionary: (parsed.dictionary ?? w).toString().trim(),
    meaning: (parsed.meaning ?? "").toString().trim(),
    grammar: (parsed.grammar ?? "").toString().trim(),
  };
}
