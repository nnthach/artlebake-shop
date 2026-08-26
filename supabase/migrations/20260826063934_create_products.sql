create table public.products (
  id uuid not null default gen_random_uuid(),
  price numeric null,
  category_id uuid null,
  image_url text[] null,
  is_active boolean null default true,
  updated_at timestamptz null,
  created_at timestamptz not null default now(),
  is_bestseller boolean null default false,

  constraint products_pkey primary key (id),

  constraint products_category_id_fkey
    foreign key (category_id)
    references public.categories (id)
    on update cascade
    on delete restrict
);