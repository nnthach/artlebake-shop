create table public.users (
  id uuid not null,
  status public.user_status not null default 'inactive',
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  has_password boolean not null default false,

  constraint users_pkey primary key (id),
  constraint users_id_fkey
    foreign key (id)
    references auth.users (id)
    on delete cascade
);