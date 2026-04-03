-- Run this in the Supabase SQL editor (project → SQL Editor → New query)

create table flashcards (
  id            bigint primary key generated always as identity,
  session_id    text        not null,
  word          text        not null,
  translation   text        not null default '',
  context       text        not null default '',
  chapter       text        not null default '',
  due_date      timestamptz not null default now(),
  interval      smallint    not null default 0,
  ease_factor   real        not null default 2.5,
  repetitions   smallint    not null default 0,
  created_at    timestamptz not null default now(),
  unique (session_id, word)
);

create index flashcards_session_due_idx on flashcards (session_id, due_date);

alter table flashcards enable row level security;

create policy "anon read"   on flashcards for select using (true);
create policy "anon insert" on flashcards for insert with check (true);
create policy "anon update" on flashcards for update using (true);
create policy "anon delete" on flashcards for delete using (true);
