CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  order_id uuid NOT NULL,

  amount numeric NOT NULL,

  status payment_status NOT NULL DEFAULT 'unpaid',

  method text,

  transaction_id text,

  gateway_response jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz,

  CONSTRAINT payments_pkey PRIMARY KEY (id),

  CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES public.orders(id)
    ON DELETE CASCADE
);