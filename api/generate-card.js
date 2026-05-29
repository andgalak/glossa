import { generateCard } from "./_lib/generateCardCore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { word } = req.body;
  if (!word || !word.trim()) {
    res.status(400).json({ error: "word is required" });
    return;
  }

  try {
    const card = await generateCard(word);
    res.status(200).json(card);
  } catch (err) {
    console.error("[api/generate-card]", err.message);
    res.status(500).json({ error: "Generation failed", detail: err.message });
  }
}
