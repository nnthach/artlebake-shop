CREATE TABLE public.preorder_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT preorder_schedules_pkey
    PRIMARY KEY (id),

  CONSTRAINT preorder_schedules_date_unique
    UNIQUE (date)
);