# Batch Tracking Implementation Guide

## Current Issue
The invoice generation is failing because the database schema doesn't have the `batch_id` column in the `sales_order_items` table yet.

## Immediate Fix Applied
I've temporarily updated the invoice route to work without batch information:
- Removed the join with `product_batches` table
- Shows '-' for batch numbers until proper implementation
- Invoice generation will now work without errors

## Complete Implementation Steps

### 1. Run Database Migration
Execute the migration file `database/add_batch_tracking_to_sales.sql`:

```sql
-- Add batch_id field to sales_order_items table to track which batch was used for each item
ALTER TABLE public.sales_order_items 
ADD COLUMN batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_order_items_batch_id ON public.sales_order_items(batch_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales_order_items.batch_id IS 'Reference to the product batch used for this sales order item';
```

### 2. Update Invoice Route (After Migration)
Once the migration is run, update `app/api/invoice/route.ts`:

```typescript
// Fetch order items with batch information
const { data: items, error: itemsError } = await supabase
  .from('sales_order_items')
  .select(`
    *,
    product_batches(
      batch_number,
      expiry_date,
      manufacturing_date
    )
  `)
  .eq('order_id', orderId);

// In PDF generation:
page.drawText(item.product_batches?.batch_number || '-', {
  x: 205,
  y: yPos - 12,
  size: 9,
  font: font,
  color: textColor,
});
```

### 3. Update Interface (After Migration)
Update the `InvoiceItem` interface:

```typescript
interface InvoiceItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  batch_id?: string;
  product_batches?: {
    batch_number: string;
    expiry_date?: string;
    manufacturing_date?: string;
  };
  products?: {
    name: string;
  };
}
```

## Current Status
- ✅ Invoice generation works (shows '-' for batch numbers)
- ✅ All TypeScript errors resolved
- ✅ Sales pages updated to use batch_id
- ⏳ Database migration needs to be run
- ⏳ Invoice route needs to be updated after migration

## Testing
After running the migration:
1. Create a new sales order with batch selection
2. Generate invoice to verify batch numbers appear correctly
3. Verify that batch tracking works end-to-end

## Rollback Plan
If issues occur, the current implementation will continue to work with '-' showing for batch numbers until the migration is properly applied.
