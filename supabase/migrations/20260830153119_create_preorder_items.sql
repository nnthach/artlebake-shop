CREATE TABLE public.preorder_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL,

  preorder_date DATE NOT NULL,

  planned_quantity INTEGER NOT NULL DEFAULT 0,

  remaining_quantity INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ,

  CONSTRAINT preorder_items_pkey
    PRIMARY KEY (id),

  CONSTRAINT preorder_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE CASCADE,

  CONSTRAINT preorder_items_product_date_unique
    UNIQUE (product_id, preorder_date),

  CONSTRAINT preorder_items_planned_quantity_check
    CHECK (planned_quantity >= 0),

  CONSTRAINT preorder_items_remaining_quantity_check
    CHECK (remaining_quantity >= 0),

  CONSTRAINT preorder_items_remaining_lte_planned_check
    CHECK (remaining_quantity <= planned_quantity)
);