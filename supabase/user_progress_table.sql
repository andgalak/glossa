-- Run this in the Supabase SQL editor (project → SQL Editor → New query)

create table user_progress (
  id                   bigint primary key generated always as identity,
  session_id           text        not null,
  chapter_id           smallint    not null,
  level                text        not null,
  completed_sentences  smallint    not null default 0,
  total_sentences      smallint    not null default 15,
  updated_at           timestamptz not null default now(),
  unique (session_id, chapter_id, level)
);

create index user_progress_session_idx on user_progress (session_id, level);

alter table user_progress enable row level security;

create policy "anon read"   on user_progress for select using (true);
create policy "anon insert" on user_progress for insert with check (true);
create policy "anon update" on user_progress for update using (true);
