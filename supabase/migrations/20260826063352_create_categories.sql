create extension if not exists "pgcrypto";

create table public.categories (
  id uuid not null default gen_random_uuid (),
  name jsonb not null,
  description jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  is_active boolean null default true,
  slug jsonb null,
  constraint categories_pkey primary key (id)
);