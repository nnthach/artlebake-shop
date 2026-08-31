-- Add is_active to preorder_items
ALTER TABLE public.preorder_items
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Optional: add index if you frequently filter active preorder items
CREATE INDEX idx_preorder_items_is_active
ON public.preorder_items(is_active);