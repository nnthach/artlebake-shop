create table public.ingredients (
  id uuid not null default gen_random_uuid(),
  name jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  is_active boolean not null default true,
  slug jsonb null,
  constraint ingredients_pkey primary key (id)
);