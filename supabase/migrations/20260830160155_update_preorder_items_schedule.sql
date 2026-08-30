ALTER TABLE public.preorder_items
  DROP CONSTRAINT IF EXISTS preorder_items_product_date_unique;

ALTER TABLE public.preorder_items
  ADD COLUMN schedule_id UUID NOT NULL;

ALTER TABLE public.preorder_items
  ADD CONSTRAINT preorder_items_schedule_id_fkey
    FOREIGN KEY (schedule_id)
    REFERENCES public.preorder_schedules(id)
    ON DELETE CASCADE;

ALTER TABLE public.preorder_items
  ADD CONSTRAINT preorder_items_schedule_product_unique
    UNIQUE (schedule_id, product_id);

ALTER TABLE public.preorder_items
  DROP COLUMN preorder_date;