-- Test query to check sales orders and their branch relationships
-- Run this in your Supabase SQL editor to debug the issue

-- Check if sales orders have branch_id
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

-- Check if there are any sales orders without branch_id
SELECT COUNT(*) as orders_without_branch
FROM sales_orders 
WHERE branch_id IS NULL;

-- Check if there are any inactive branches being referenced
SELECT 
  COUNT(*) as orders_with_inactive_branches
FROM sales_orders so
JOIN branches b ON so.branch_id = b.id
WHERE b.is_active = false;

-- Check branches table
SELECT id, name, code, is_active, created_at
FROM branches
ORDER BY created_at DESC;
