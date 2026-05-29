import { supabase } from "../lib/supabase.js";

// Maps a generation result (camelCase from the API) + edits to DB column names.
// userId is the authenticated Supabase user id (vocab_cards.user_id).
export function toRow(card, userId) {
  return {
    user_id: userId,
    english: card.english ?? "",
    greek: card.greek ?? "",
    part_of_speech: card.partOfSpeech ?? "",
    gender: card.gender ?? "",
    example_greek: card.exampleGreek ?? "",
    example_translation: card.exampleTranslation ?? "",
    notes: card.notes ?? "",
    source_input: card.sourceInput ?? card.source_input ?? "",
  };
}

export async function loadCards(userId) {
  const { data, error } = await supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[vocab_cards] load error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function insertCards(cards, userId) {
  const rows = cards.map(c => toRow(c, userId));
  const { data, error } = await supabase
    .from("vocab_cards")
    .insert(rows)
    .select();
  if (error) {
    console.warn("[vocab_cards] insert error:", error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function updateCard(id, patch) {
  const { error } = await supabase
    .from("vocab_cards")
    .update(patch)
    .eq("id", id);
  if (error) console.warn("[vocab_cards] update error:", error.message);
}

export async function deleteCard(id) {
  const { error } = await supabase.from("vocab_cards").delete().eq("id", id);
  if (error) console.warn("[vocab_cards] delete error:", error.message);
}

export async function generateCard(word) {
  const res = await fetch("/api/generate-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || detail.error || `API ${res.status}`);
  }
  return res.json();
}
