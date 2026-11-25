import { translateInContext } from "./_lib/translateSentenceCore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { word, sentence } = req.body || {};
  if (!word) {
    res.status(400).json({ error: "word is required" });
    return;
  }

  try {
    const out = await translateInContext(word, sentence);
    res.status(200).json(out);
  } catch (err) {
    console.error("[api/translate-sentence]", err);
    res.status(500).json({ error: "translate_failed", detail: err.message });
  }
}
