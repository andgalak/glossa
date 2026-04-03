-- Run this in the Supabase SQL editor (project → SQL Editor → New query)

create table sentences (
  id         bigint primary key generated always as identity,
  chapter_id smallint     not null,
  level      text         not null,
  sentences  jsonb        not null,
  created_at timestamptz  not null default now()
);

-- Index for the cache lookup (chapter_id + level)
create index sentences_chapter_level_idx on sentences (chapter_id, level);

-- Row Level Security: allow anon reads and inserts (the app uses the anon key)
alter table sentences enable row level security;

create policy "anon read"   on sentences for select using (true);
create policy "anon insert" on sentences for insert with check (true);
