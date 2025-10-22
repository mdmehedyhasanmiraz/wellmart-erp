# Branch-Specific Batch Stock System

## Overview

The branch-specific batch stock system ensures that when purchases are made, the inventory is properly tracked per branch. This system uses two main tables:

1. **`product_batches`** - Stores batch information (batch number, expiry date, cost price, etc.)
2. **`product_branch_batch_stocks`** - Links batches to specific branches with quantities

## How It Works

### Purchase Flow

When a purchase order is created with items:

1. **Batch Creation/Update**: 
   - If batch doesn't exist → Creates new batch in `product_batches`
   - If batch exists → Updates quantity in `product_batches`

2. **Branch Stock Creation/Update**:
   - Creates or updates entry in `product_branch_batch_stocks`
   - Links the batch to the specific branch from the purchase order
   - Tracks quantity for that branch

### Database Schema

#### `product_branch_batch_stocks` Table
```sql
CREATE TABLE public.product_branch_batch_stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_branch_batch_stocks_pkey PRIMARY KEY (id),
  CONSTRAINT product_branch_batch_stocks_product_id_branch_id_batch_id_key UNIQUE (product_id, branch_id, batch_id),
  CONSTRAINT product_branch_batch_stocks_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES product_batches (id) ON DELETE CASCADE,
  CONSTRAINT product_branch_batch_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
  CONSTRAINT product_branch_batch_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
```

### Key Features

- **Unique Constraint**: Prevents duplicate entries for same product+branch+batch combination
- **Cascade Deletes**: When batch/branch/product is deleted, related stock entries are automatically removed
- **Automatic Triggers**: Database triggers update batch remaining quantities when stock changes

## Service Methods

### BatchService

#### Branch Stock Management
- `createBranchBatchStock()` - Creates new branch-specific stock entry
- `getBranchBatchStock()` - Gets stock for specific product+branch+batch
- `updateBranchBatchStockQuantity()` - Updates quantity for existing stock
- `getBranchBatchStocksByProduct()` - Gets all batches for a product in a branch

### PurchaseService Integration

The purchase service automatically handles branch-specific stock:

#### When Adding Items
```typescript
// Automatically creates/updates both:
// 1. product_batches entry
// 2. product_branch_batch_stocks entry
await PurchaseService.addItems(orderId, items);
```

#### When Updating Items
- Updates batch quantities in `product_batches`
- Updates branch-specific quantities in `product_branch_batch_stocks`
- Handles batch number changes (moves stock between batches)

#### When Deleting Items
- Reduces batch quantities in `product_batches`
- Reduces branch-specific quantities in `product_branch_batch_stocks`

## Benefits

1. **Accurate Inventory Tracking**: Each branch knows exactly what batches they have
2. **Batch Traceability**: Can track which branch received which batch
3. **Expiry Management**: Can manage expiry dates per branch
4. **Cost Tracking**: Track cost prices per batch per branch
5. **Stock Transfers**: Foundation for inter-branch transfers

## Usage Examples

### Creating Purchase Order
```typescript
// When creating a purchase order for Branch A
const order = await PurchaseService.createOrder({
  branch_id: 'branch-a-uuid',
  supplier_id: 'supplier-uuid',
  // ... other fields
});

// Adding items automatically creates branch-specific stock
await PurchaseService.addItems(order.id, [
  {
    product_id: 'product-uuid',
    batch_number: 'BATCH001',
    quantity: 100,
    unit_price: 10.00
  }
]);
```

### Querying Branch Stock
```typescript
// Get all batches for a product in a specific branch
const branchStocks = await BatchService.getBranchBatchStocksByProduct(
  'product-uuid', 
  'branch-a-uuid'
);
```

## Database Triggers

The system includes automatic triggers:

- `update_batch_remaining_on_stock_change` - Updates `quantity_remaining` in `product_batches` when stock changes
- `update_product_branch_batch_stocks_updated_at` - Updates timestamp when stock is modified

## Error Handling

The system includes comprehensive error handling:

- Continues processing other items if one fails
- Logs detailed error messages
- Doesn't break purchase order creation if batch operations fail
- Graceful handling of missing branch_id or invalid data

## Future Enhancements

1. **Stock Transfers**: Move batches between branches
2. **Expiry Alerts**: Notify branches of expiring batches
3. **Stock Reports**: Generate branch-specific inventory reports
4. **Batch History**: Track all movements of batches
5. **Integration with Sales**: Automatically reduce stock when items are sold
