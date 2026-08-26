create table public.product_ingredients (
  ingredient_id uuid not null,
  product_id uuid not null,
  created_at timestamptz not null default now(),

  constraint product_ingredients_pkey
    primary key (ingredient_id, product_id),

  constraint product_ingredients_ingredient_id_fkey
    foreign key (ingredient_id)
    references public.ingredients (id)
    on delete cascade,

  constraint product_ingredients_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on delete cascade
);