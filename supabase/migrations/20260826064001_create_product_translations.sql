create table public.product_translations (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  locale text not null,
  name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  slug text null,

  constraint product_translations_pkey primary key (id),

  constraint product_translations_locale_slug_key
    unique (locale, slug),

  constraint product_translations_product_id_locale_key
    unique (product_id, locale),

  constraint product_translations_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on delete cascade
);