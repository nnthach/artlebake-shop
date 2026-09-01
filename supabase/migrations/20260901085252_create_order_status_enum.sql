CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'delivered',
  'cancelled'
);