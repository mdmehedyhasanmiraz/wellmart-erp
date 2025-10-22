# Product Edit Pages - Branch Integration Update

## Overview
Updated both admin and branch product edit pages to include branch selection for batch management and integrate with the `product_branch_batch_stocks` table.

## Changes Made

### 1. **Admin Product Edit Page** (`app/(admin)/admin/products/[id]/edit/page.tsx`)

#### **New Imports**
```typescript
import { BranchService } from '@/lib/branchService';
import { ProductWithDetails, Branch } from '@/types/user';
```

#### **New State Variables**
```typescript
const [branches, setBranches] = useState<Branch[]>([]);
const [selectedBranchId, setSelectedBranchId] = useState<string>('');
```

#### **Branch Fetching Logic**
```typescript
useEffect(() => {
  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const branchesData = await BranchService.getAll();
      setBranches(branchesData);
      // Set first branch as default if none selected
      if (branchesData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };
  fetchBranches();
}, [selectedBranchId]);
```

#### **Enhanced Batch Creation Logic**
```typescript
// Create new batches and link to selected branch
await Promise.all(
  created.map(async (b) => {
    const newBatch = await InventoryService.createBatch({
      product_id: productId,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      manufacturing_date: b.manufacturing_date,
      supplier_batch_number: b.supplier_batch_number,
      cost_price: b.cost_price,
      quantity_received: b.quantity_received || 0,
    });
    
    // Create branch-batch stock entry
    if (newBatch && selectedBranchId) {
      await InventoryService.updateBatchStock(
        productId,
        selectedBranchId,
        newBatch.id,
        b.quantity_received || 0
      );
    }
  })
);
```

#### **Branch Selection UI**
```tsx
{/* Branch Selection for New Batches */}
{stockView === 'batch' && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-blue-700 mb-2">
          Assign New Batches to Branch
        </label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm text-blue-600">
        <p>New batches will be assigned to the selected branch</p>
        <p>and saved to the product_branch_batch_stocks table</p>
      </div>
    </div>
  </div>
)}
```

#### **Enhanced Add Batch Button**
```tsx
<button
  type="button"
  onClick={async () => {
    if (!selectedBranchId) {
      alert('Please select a branch before adding a new batch');
      return;
    }
    const batch_number = await InventoryService.generateBatchNumber(productId);
    setBatches(prev => [...prev, { batch_number, quantity_received: 0, quantity_remaining: 0 }]);
  }}
  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
>
  Add Batch
</button>
{!selectedBranchId && (
  <p className="mt-2 text-sm text-red-600">
    ⚠️ Please select a branch before adding new batches
  </p>
)}
```

### 2. **Branch Product Edit Page** (`app/(branch)/branch/products/[id]/edit/page.tsx`)

#### **Similar Changes with Branch-Specific Logic**
- **Default Branch Selection**: Automatically selects the user's branch as default
- **Color Scheme**: Uses emerald colors instead of purple/blue
- **Access Control**: Only MAIN branch users can edit products

#### **Branch-Specific Branch Fetching**
```typescript
useEffect(() => {
  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const branchesData = await BranchService.getAll();
      setBranches(branchesData);
      // Set user's branch as default if none selected
      if (userProfile?.branch_id && !selectedBranchId) {
        setSelectedBranchId(userProfile.branch_id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };
  fetchBranches();
}, [userProfile?.branch_id, selectedBranchId]);
```

## Database Integration

### **product_branch_batch_stocks Table Usage**
The system now creates entries in the `product_branch_batch_stocks` table when new batches are created:

```sql
-- Table structure
create table public.product_branch_batch_stocks (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  branch_id uuid not null,
  batch_id uuid not null,
  quantity integer not null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint product_branch_batch_stocks_pkey primary key (id),
  constraint product_branch_batch_stocks_product_id_branch_id_batch_id_key unique (product_id, branch_id, batch_id),
  constraint product_branch_batch_stocks_batch_id_fkey foreign KEY (batch_id) references product_batches (id) on delete CASCADE,
  constraint product_branch_batch_stocks_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint product_branch_batch_stocks_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
);
```

### **InventoryService Integration**
Uses the existing `InventoryService.updateBatchStock()` method to create/update branch-batch stock entries:

```typescript
await InventoryService.updateBatchStock(
  productId,
  selectedBranchId,
  newBatch.id,
  b.quantity_received || 0
);
```

## User Experience Improvements

### **Visual Indicators**
- **Branch Selection Panel**: Clear blue/emerald colored panel explaining the functionality
- **Warning Messages**: Red warning text when no branch is selected
- **Validation**: Prevents adding batches without selecting a branch

### **Smart Defaults**
- **Admin Page**: Selects first available branch as default
- **Branch Page**: Selects user's branch as default
- **Auto-population**: Branch dropdown populated with all active branches

### **Error Handling**
- **Branch Validation**: Alerts user if trying to add batch without branch selection
- **Graceful Fallbacks**: Handles missing branch data gracefully
- **Console Logging**: Comprehensive error logging for debugging

## Workflow

### **Admin Workflow**
1. **Select Branch**: Choose which branch to assign new batches to
2. **Add Batch**: Click "Add Batch" button (validates branch selection)
3. **Fill Details**: Enter batch number, quantities, dates, etc.
4. **Save**: Batch is created in `product_batches` and linked to branch in `product_branch_batch_stocks`

### **Branch Workflow**
1. **Auto-Select**: User's branch is automatically selected
2. **Add Batch**: Click "Add Batch" button (validates branch selection)
3. **Fill Details**: Enter batch number, quantities, dates, etc.
4. **Save**: Batch is created and linked to user's branch

## Benefits

### **Data Integrity**
- ✅ **Branch Tracking**: Every batch is now associated with a specific branch
- ✅ **Stock Management**: Branch-specific stock levels are maintained
- ✅ **Audit Trail**: Clear tracking of which branch owns which batches

### **User Experience**
- ✅ **Intuitive Interface**: Clear branch selection with visual indicators
- ✅ **Validation**: Prevents data entry errors
- ✅ **Smart Defaults**: Reduces user effort with automatic branch selection

### **System Integration**
- ✅ **Database Consistency**: Proper foreign key relationships maintained
- ✅ **Service Layer**: Leverages existing InventoryService methods
- ✅ **Scalability**: Supports multiple branches and complex inventory scenarios

## Testing Scenarios

### **Admin Testing**
1. **Branch Selection**: Verify all branches appear in dropdown
2. **Default Selection**: Confirm first branch is selected by default
3. **Batch Creation**: Test creating batches with branch assignment
4. **Validation**: Ensure warning appears when no branch selected

### **Branch Testing**
1. **Auto-Selection**: Verify user's branch is selected by default
2. **Batch Creation**: Test creating batches for user's branch
3. **Access Control**: Confirm only MAIN branch users can edit
4. **Data Persistence**: Verify data is saved to `product_branch_batch_stocks`

## Future Enhancements

### **Potential Improvements**
1. **Batch Transfer**: Allow transferring batches between branches
2. **Bulk Operations**: Select multiple batches and assign to branch
3. **Branch Filtering**: Filter existing batches by branch
4. **Stock Alerts**: Notify when branch stock levels are low
5. **Reporting**: Branch-specific inventory reports

### **Database Optimizations**
1. **Indexes**: Add indexes for common query patterns
2. **Triggers**: Implement automatic stock level updates
3. **Views**: Create views for common branch-batch queries
4. **Constraints**: Add additional business rule constraints

## Result

The product edit pages now provide comprehensive branch-batch management with:
- **Clear UI** for branch selection
- **Robust validation** to prevent errors
- **Database integration** with `product_branch_batch_stocks`
- **Smart defaults** for better user experience
- **Comprehensive error handling** for reliability

Users can now properly manage inventory at the branch level while maintaining data integrity and providing a smooth user experience! 🎉
