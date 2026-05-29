// Anonymous per-device session id, used as `session_id` for flashcards and
// user_progress now that the app has no login. Stored in localStorage so a
// returning visitor keeps their deck and progress on the same browser.

const KEY = "glossa_session_id";

export function sessionId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
