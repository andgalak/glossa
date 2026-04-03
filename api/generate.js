import { generateSentences } from "./_lib/generateCore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { chapterPrompt } = req.body;
  if (!chapterPrompt) {
    res.status(400).json({ error: "chapterPrompt is required" });
    return;
  }

  try {
    const sentences = await generateSentences(chapterPrompt);
    res.status(200).json(sentences);
  } catch (err) {
    console.error("[api/generate]", err);
    res.status(500).json({ error: "Generation failed", detail: err.message });
  }
}
