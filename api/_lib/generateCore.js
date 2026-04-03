import Anthropic from "@anthropic-ai/sdk";

export async function generateSentences(chapterPrompt) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: chapterPrompt }],
  });

  const raw = message.content[0].text.trim();
  // Strip markdown fences if the model adds them despite the prompt's instruction
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const rows = JSON.parse(json);

  // Map CLAUDE.md schema fields → UI field names:
  //   naturalTranslation → translation
  //   grammarShort       → grammarFull (grammar modal fallback; full version comes in step 1)
  return rows.map((r, i) => ({
    id: i + 1,
    before: r.before ?? "",
    answer: r.answer ?? "",
    after: r.after ?? "",
    translation: r.naturalTranslation ?? "",
    grammarLabel: r.grammarLabel ?? "",
    grammarShort: r.grammarShort ?? "",
    grammarFull: r.grammarShort ?? "",   // promoted to modal until step 1 finalises long form
  }));
}
