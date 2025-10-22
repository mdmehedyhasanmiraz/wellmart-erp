# Invoice "Branch Not Found" Error Fix

## Problem Identified
The invoice generation was failing with `{error: branch not found}` when trying to fetch branch details for sales orders.

## Root Causes
1. **Missing branch_id**: Some sales orders might not have a `branch_id` set
2. **Inactive branches**: Sales orders might reference branches that are marked as `is_active = false`
3. **Non-existent branches**: Sales orders might reference branch IDs that don't exist in the database
4. **Poor error handling**: The invoice generation would fail completely if branch data couldn't be fetched

## Solution Implemented

### 1. **Enhanced Branch Query with Fallback** (`app/api/invoice/route.ts`)

**Before:**
```typescript
// Single query that would fail if branch not found
const { data: branch, error: branchError } = await supabase
  .from('branches')
  .select('id, name, address, phone, email')
  .eq('id', order.branch_id)
  .single();
```

**After:**
```typescript
// Two-step fallback approach
// Step 1: Try to get active branch
let { data: branch, error: branchError } = await supabase
  .from('branches')
  .select('id, name, address, phone, email')
  .eq('id', order.branch_id)
  .eq('is_active', true)
  .single();

// Step 2: If not found, try without is_active filter
if (branchError) {
  const { data: inactiveBranch, error: inactiveError } = await supabase
    .from('branches')
    .select('id, name, address, phone, email')
    .eq('id', order.branch_id)
    .single();
  
  if (!inactiveError && inactiveBranch) {
    branch = inactiveBranch;
    branchError = null;
  }
}
```

### 2. **Graceful Fallback for Missing Branches**

**Before:**
- Invoice generation would fail completely
- No fallback data provided

**After:**
```typescript
if (branchError || !branch) {
  // Provide fallback data instead of failing
  branchData = { 
    id: order.branch_id, 
    name: 'Branch Not Found', 
    address: 'Address not available', 
    phone: null, 
    email: null 
  };
} else {
  branchData = branch;
}
```

### 3. **Handle Orders Without Branch ID**

**Before:**
- No handling for orders without `branch_id`

**After:**
```typescript
if (!order.branch_id) {
  branchData = { 
    id: '', 
    name: 'No Branch Assigned', 
    address: 'No address available', 
    phone: null, 
    email: null 
  };
}
```

### 4. **Enhanced Error Handling and Logging**

**Added comprehensive logging:**
```typescript
console.log('Order found:', { 
  orderId: order.id, 
  status: order.status, 
  customer: order.customer_name,
  branch_id: order.branch_id,
  party_id: order.party_id,
  employee_id: order.employee_id
});

console.log('Branch fetch result:', { branch, branchError });
console.log('Branch data for PDF:', branchData);
```

**Better PDF error handling:**
```typescript
try {
  const pdfBytes = await generatePDFInvoice(/* ... */);
  return new NextResponse(Buffer.from(pdfBytes), { /* ... */ });
} catch (pdfError) {
  return NextResponse.json({ 
    error: 'Failed to generate PDF', 
    details: pdfError.message,
    branchData: branchData  // Include branch data in error for debugging
  }, { status: 500 });
}
```

## Benefits

### ✅ **Robust Error Handling**
- Invoice generation no longer fails due to missing/inactive branches
- Graceful fallback data ensures PDF can still be generated
- Detailed error messages for debugging

### ✅ **Better User Experience**
- Users can still view invoices even if branch data is missing
- Clear indication when branch information is unavailable
- No more "branch not found" errors blocking invoice access

### ✅ **Improved Debugging**
- Comprehensive logging shows exactly what's happening
- Error responses include relevant data for troubleshooting
- Easy to identify data quality issues

### ✅ **Data Quality Insights**
- Logs reveal if sales orders are missing `branch_id`
- Identifies inactive branches being referenced
- Helps maintain data integrity

## Testing Scenarios

The fix handles these scenarios:

1. **✅ Normal Case**: Active branch exists → Uses branch data
2. **✅ Inactive Branch**: Branch exists but `is_active = false` → Uses branch data with warning
3. **✅ Missing Branch**: Branch ID doesn't exist → Uses fallback "Branch Not Found"
4. **✅ No Branch ID**: Order has no `branch_id` → Uses fallback "No Branch Assigned"
5. **✅ Database Error**: Query fails → Uses fallback data, doesn't crash

## Debugging Tools

### SQL Query for Investigation
```sql
-- Check sales orders and their branch relationships
SELECT 
  so.id,
  so.branch_id,
  so.customer_name,
  so.status,
  b.name as branch_name,
  b.is_active as branch_active
FROM sales_orders so
LEFT JOIN branches b ON so.branch_id = b.id
ORDER BY so.created_at DESC
LIMIT 10;
```

### Console Logs to Monitor
- Order details with branch_id
- Branch fetch attempts and results
- Fallback data being used
- PDF generation success/failure

## Future Improvements

1. **Data Validation**: Add checks when creating sales orders to ensure branch_id is valid
2. **Branch Status Updates**: Notify when inactive branches are referenced
3. **Data Cleanup**: Script to fix orders with invalid branch references
4. **UI Indicators**: Show branch status in the sales order interface

## Result

The invoice generation is now robust and will work even when:
- Branches are inactive
- Branch data is missing
- Sales orders have invalid branch references
- Database queries fail

Users will always be able to generate invoices, with appropriate fallback information displayed when branch data is unavailable.
