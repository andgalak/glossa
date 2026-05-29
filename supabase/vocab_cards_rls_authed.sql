-- OPTIONAL but RECOMMENDED once Glossa Cards uses real accounts.
-- Replaces the permissive anon policies (using true) with owner-scoped ones,
-- so each signed-in user can only see and modify their own cards.
-- Run in the Supabase SQL editor. The app already filters by user_id, so it
-- keeps working with or without this; this just enforces it at the database.

drop policy if exists "anon read"   on vocab_cards;
drop policy if exists "anon insert" on vocab_cards;
drop policy if exists "anon update" on vocab_cards;
drop policy if exists "anon delete" on vocab_cards;

create policy "own read"   on vocab_cards for select using (auth.uid() = user_id);
create policy "own insert" on vocab_cards for insert with check (auth.uid() = user_id);
create policy "own update" on vocab_cards for update using (auth.uid() = user_id);
create policy "own delete" on vocab_cards for delete using (auth.uid() = user_id);
