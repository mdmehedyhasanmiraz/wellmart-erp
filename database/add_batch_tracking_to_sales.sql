-- Add batch_id field to sales_order_items table to track which batch was used for each item
ALTER TABLE public.sales_order_items 
ADD COLUMN batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_order_items_batch_id ON public.sales_order_items(batch_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales_order_items.batch_id IS 'Reference to the product batch used for this sales order item';

-- Update the existing batch_number field in the TypeScript interface to use batch_id instead
-- Note: This migration adds the database field, but the application code needs to be updated
-- to use batch_id instead of batch_number for sales order items
