CREATE TYPE public.payment_status AS ENUM (
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded'
);