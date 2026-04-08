import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { word } = req.body;
  if (!word) {
    res.status(400).json({ error: "word is required" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Translate this single Greek word to English: "${word}". Reply with only the English translation, 1-4 words maximum. No punctuation, no explanation.`,
        },
      ],
    });
    const translation = message.content[0].text.trim();
    res.status(200).json({ translation });
  } catch (err) {
    console.error("[api/translate]", err);
    res.status(500).json({ error: "Translation failed", detail: err.message });
  }
}
