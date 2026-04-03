-- Run this in the Supabase SQL editor (project → SQL Editor → New query)

alter table flashcards
  add column retired boolean not null default false;
