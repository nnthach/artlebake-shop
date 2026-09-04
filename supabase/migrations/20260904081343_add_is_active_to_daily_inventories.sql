ALTER TABLE public.daily_inventories
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;