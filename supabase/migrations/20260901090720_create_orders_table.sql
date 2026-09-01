CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  order_code text NOT NULL,

  status order_status NOT NULL DEFAULT 'pending',

  payment_status payment_status NOT NULL DEFAULT 'unpaid',

  order_type text NOT NULL,

  fulfillment_method fulfillment_method NOT NULL,

  -- UUID của preorder_schedules
  preorder_date_id uuid,

  -- customer information
  name text NOT NULL,
  phone text NOT NULL,
  email text,

  -- shipping information
  address text,
  city text,
  district text,
  ward text,
  note text,

  -- order total
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,

  payment_method text,

  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT orders_pkey PRIMARY KEY (id),

  CONSTRAINT orders_order_code_key
    UNIQUE (order_code),

  CONSTRAINT orders_preorder_date_id_fkey
    FOREIGN KEY (preorder_date_id)
    REFERENCES public.preorder_schedules(id),

  CONSTRAINT orders_order_type_check
    CHECK (
      order_type IN ('available', 'preorder')
    ),

CONSTRAINT payment_method_check
    CHECK (
      payment_method IN ('payos')
    ),

  CONSTRAINT orders_preorder_date_check
    CHECK (
      (order_type = 'preorder' AND preorder_date_id IS NOT NULL)
      OR
      (order_type = 'available' AND preorder_date_id IS NULL)
    ),

  CONSTRAINT orders_delivery_address_check
    CHECK (
      fulfillment_method = 'pickup'
      OR (
        city IS NOT NULL
        AND district IS NOT NULL
        AND ward IS NOT NULL
        AND address IS NOT NULL
      )
    )
);