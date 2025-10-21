-- Add employee_id field to sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_employee_id ON public.sales_orders(employee_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales_orders.employee_id IS 'Reference to the employee who created this sales order';

-- Update the default status from 'draft' to 'posted'
ALTER TABLE public.sales_orders 
ALTER COLUMN status SET DEFAULT 'posted'::sales_status;
