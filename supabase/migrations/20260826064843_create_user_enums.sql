create type public.user_status as enum (
  'inactive',
  'active',
  'banned'
);

create type public.user_role as enum (
  'customer',
  'admin'
);