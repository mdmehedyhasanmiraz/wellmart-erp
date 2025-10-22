# Purchase Batch Tracking System

## Overview
When purchases are made, the system automatically creates or updates batches in the `product_batches` table. This ensures proper inventory tracking and batch management.

## How It Works

### 1. **Automatic Batch Creation**
When a purchase order is created with items, the system:
- Checks if a batch with the same `batch_number` already exists for the product
- If batch exists: Updates the quantity (adds to existing batch)
- If batch doesn't exist: Creates a new batch record

### 2. **Batch Data Structure**
Each batch record contains:
```sql
- id: UUID (primary key)
- product_id: UUID (foreign key to products)
- batch_number: TEXT (unique per product)
- expiry_date: DATE (optional)
- manufacturing_date: DATE (optional)
- supplier_batch_number: TEXT (optional)
- cost_price: NUMERIC (purchase price per unit)
- quantity_received: INTEGER (total quantity received)
- quantity_remaining: INTEGER (current available quantity)
- status: TEXT ('active', 'expired', 'recalled', 'consumed')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (optional)
```

### 3. **Purchase Service Integration**

#### **Adding Items (`addItems`)**
```typescript
// When items are added to a purchase order
await PurchaseService.addItems(orderId, items);

// System automatically:
// 1. Creates purchase_order_items records
// 2. Creates/updates batches for each item
```

#### **Updating Items (`updateOrderItem`)**
```typescript
// When an item is updated
await PurchaseService.updateOrderItem(itemId, updates);

// System handles:
// - Quantity changes: Updates batch quantities
// - Batch number changes: Moves quantities between batches
// - Creates new batches if needed
```

#### **Deleting Items (`deleteOrderItem`)**
```typescript
// When an item is deleted
await PurchaseService.deleteOrderItem(itemId);

// System automatically:
// 1. Deletes the purchase_order_item
// 2. Reduces batch quantities accordingly
```

## Batch Service Methods

### **Core Methods**
- `createBatch(batchData)` - Creates a new batch
- `getBatchByNumber(productId, batchNumber)` - Finds batch by product and batch number
- `updateBatchQuantity(batchId, additionalQuantity)` - Updates batch quantities
- `getBatchesByProduct(productId)` - Gets all batches for a product
- `updateBatchStatus(batchId, status)` - Updates batch status
- `deleteBatch(batchId)` - Deletes a batch

### **Example Usage**
```typescript
// Create a new batch
const batch = await BatchService.createBatch({
  product_id: 'product-uuid',
  batch_number: 'BATCH001',
  cost_price: 10.50,
  quantity_received: 100,
  quantity_remaining: 100,
  status: 'active'
});

// Update batch quantity
await BatchService.updateBatchQuantity(batch.id, 50); // Adds 50 units

// Get batch by number
const existingBatch = await BatchService.getBatchByNumber('product-uuid', 'BATCH001');
```

## Business Logic

### **Batch Creation Rules**
1. **Unique Constraint**: Each product can only have one batch with the same batch number
2. **Quantity Tracking**: Both `quantity_received` and `quantity_remaining` are maintained
3. **Cost Price**: Stored from the purchase order unit price
4. **Status Management**: New batches start as 'active'

### **Quantity Updates**
- **Purchase**: Increases both `quantity_received` and `quantity_remaining`
- **Sale**: Decreases only `quantity_remaining` (tracked separately)
- **Adjustment**: Can modify quantities as needed

### **Error Handling**
- If batch creation fails, the purchase order still succeeds
- Individual item failures don't affect other items
- Comprehensive logging for debugging

## Integration Points

### **Purchase Forms**
- Manual batch number input (no dropdown selection)
- Batch numbers are validated and processed automatically
- No user intervention required for batch management

### **Inventory Management**
- Batches are automatically available for sales
- Quantity tracking is maintained across purchases and sales
- Batch status can be updated (expired, recalled, etc.)

### **Reporting**
- Batch-level reporting available
- Cost tracking per batch
- Expiry date management
- Supplier batch number tracking

## Benefits

1. **Automatic Tracking**: No manual batch creation required
2. **Accurate Inventory**: Real-time quantity tracking
3. **Cost Management**: Purchase prices stored per batch
4. **Traceability**: Full audit trail of batch movements
5. **Flexibility**: Supports various batch numbering systems
6. **Error Resilience**: Robust error handling and logging

## Future Enhancements

- Batch expiry notifications
- Automatic status updates based on dates
- Batch transfer between branches
- Advanced batch reporting and analytics
