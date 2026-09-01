CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  order_id uuid NOT NULL,
  product_id uuid NOT NULL,

  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT order_items_pkey
    PRIMARY KEY (id),

  CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES public.orders(id)
    ON DELETE CASCADE,

  CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id),

  CONSTRAINT order_items_quantity_check
    CHECK (quantity > 0),

  CONSTRAINT order_items_unit_price_check
    CHECK (unit_price >= 0),

  CONSTRAINT order_items_subtotal_check
    CHECK (subtotal >= 0)
);