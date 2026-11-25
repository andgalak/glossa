-- Reader audio cache: one row per (user, voice, paragraph text).
-- Stores the synthesized MP3 (base64) plus Azure word-boundary timings so a
-- paragraph is never re-synthesized. Follows the same batch-and-cache rule as
-- sentence generation: the app always reads from here first.
--
-- Run this in the Supabase SQL editor before using the Reader.

create extension if not exists pgcrypto;

create table if not exists reader_audio (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  hash       text not null,              -- sha-256 of voice + "\n" + text
  voice      text not null,
  text       text not null,
  audio      text not null,              -- base64 mp3
  words      jsonb not null default '[]', -- [{ text, audioOffset(ms), duration(ms), textOffset, wordLength }]
  created_at timestamptz not null default now(),
  unique (user_id, hash)
);

create index if not exists reader_audio_user_hash_idx on reader_audio (user_id, hash);

-- Owner-only access.
alter table reader_audio enable row level security;

drop policy if exists "reader_audio owner select" on reader_audio;
drop policy if exists "reader_audio owner insert" on reader_audio;
drop policy if exists "reader_audio owner delete" on reader_audio;

create policy "reader_audio owner select" on reader_audio
  for select using (auth.uid() = user_id);
create policy "reader_audio owner insert" on reader_audio
  for insert with check (auth.uid() = user_id);
create policy "reader_audio owner delete" on reader_audio
  for delete using (auth.uid() = user_id);
