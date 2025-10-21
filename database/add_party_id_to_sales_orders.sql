-- Add party_id field to sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_party_id ON public.sales_orders(party_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales_orders.party_id IS 'Reference to the party/customer for this sales order';
