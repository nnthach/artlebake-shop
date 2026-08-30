CREATE TYPE public.inventory_status AS ENUM (
  'draft',
  'available',
  'low_stock',
  'out_of_stock'
);

CREATE TABLE public.daily_inventories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL,

  planned_quantity INTEGER NOT NULL DEFAULT 0,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,

  status public.inventory_status NOT NULL DEFAULT 'available',

  business_date DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  CONSTRAINT daily_inventories_pkey
    PRIMARY KEY (id),

  CONSTRAINT daily_inventories_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE,

  CONSTRAINT daily_inventories_product_date_unique
    UNIQUE (product_id, business_date),

  CONSTRAINT daily_inventories_planned_quantity_check
    CHECK (planned_quantity >= 0),

  CONSTRAINT daily_inventories_remaining_quantity_check
    CHECK (remaining_quantity >= 0),

  CONSTRAINT daily_inventories_remaining_lte_planned_check
    CHECK (remaining_quantity <= planned_quantity)
);