-- Run this in the Supabase SQL editor (project → SQL Editor → New query)
-- Table for the standalone "Glōssa Cards" flashcards app (/flashcards).
-- Separate from the existing `flashcards` table — that one is left untouched.

create table vocab_cards (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        null,            -- anon device id for now; real auth later
  english             text        not null,
  greek               text        not null,
  part_of_speech      text        not null default '',  -- noun, verb, adjective, etc.
  gender              text        not null default '',   -- ο / η / το for nouns, else ''
  example_greek       text        not null default '',
  example_translation text        not null default '',
  notes               text        not null default '',   -- irregular forms, register notes
  source_input        text        not null default '',   -- exactly what the user typed
  -- SM-2 fields, named to match src/lib/sm2.js so the algorithm is reused unchanged
  ease_factor         real        not null default 2.5,
  interval            integer     not null default 0,
  repetitions         integer     not null default 0,
  due_date            timestamptz not null default now(),
  retired             boolean     not null default false,
  created_at          timestamptz not null default now()
);

create index vocab_cards_user_due_idx on vocab_cards (user_id, due_date);

alter table vocab_cards enable row level security;

-- Anon access, consistent with the rest of the project (the app uses the anon key)
create policy "anon read"   on vocab_cards for select using (true);
create policy "anon insert" on vocab_cards for insert with check (true);
create policy "anon update" on vocab_cards for update using (true);
create policy "anon delete" on vocab_cards for delete using (true);
