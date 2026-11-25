import { synthesize } from "./_lib/ttsCore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, voice } = req.body || {};
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    const out = await synthesize(text, voice);
    res.status(200).json(out);
  } catch (err) {
    if (err.code === "AZURE_NOT_CONFIGURED") {
      // Not an error the client should treat as a failure: it falls back to
      // browser speech synthesis.
      res.status(503).json({ error: "azure_not_configured" });
      return;
    }
    console.error("[api/tts]", err);
    res.status(500).json({ error: "tts_failed", detail: err.message });
  }
}
