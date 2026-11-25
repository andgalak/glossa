import { supabase } from "../lib/supabase.js";

export const DEFAULT_VOICE = "el-GR-AthinaNeural";

// sha-256 of voice + text, matching the cache key stored in reader_audio.hash.
async function hashKey(voice, text) {
  const data = new TextEncoder().encode(voice + "\n" + text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function dataUrl(base64, mime = "audio/mpeg") {
  return `data:${mime};base64,${base64}`;
}

// Get synthesized audio + word timings for a paragraph.
// Order: Supabase cache -> /api/tts (Azure) -> cache the result.
// Returns { audio (data URL), words } on success,
// or { unavailable: true } when Azure is not configured (caller uses browser TTS).
export async function getParagraphAudio(text, userId, voice = DEFAULT_VOICE) {
  const hash = await hashKey(voice, text);

  // 1. Cache.
  if (userId) {
    const { data } = await supabase
      .from("reader_audio")
      .select("audio, words")
      .eq("user_id", userId)
      .eq("hash", hash)
      .maybeSingle();
    if (data?.audio) {
      return { audio: dataUrl(data.audio), words: data.words ?? [], source: "cache" };
    }
  }

  // 2. Synthesize.
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });

  if (res.status === 503) return { unavailable: true };
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || detail.error || `TTS ${res.status}`);
  }

  const { audio, words } = await res.json();

  // 3. Cache for next time (best effort; never block playback on it).
  if (userId) {
    supabase
      .from("reader_audio")
      .insert({ user_id: userId, hash, voice, text, audio, words })
      .then(({ error }) => {
        if (error) console.warn("[reader_audio] cache write:", error.message);
      });
  }

  return { audio: dataUrl(audio), words: words ?? [], source: "azure" };
}

// In-context translation for a tapped word (dictionary form + meaning + grammar).
export async function translateWord(word, sentence) {
  const res = await fetch("/api/translate-sentence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, sentence }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || detail.error || `Translate ${res.status}`);
  }
  return res.json(); // { dictionary, meaning, grammar }
}
