# Supabase Storage Setup Guide

## Issue: Row Level Security Policy Violation

The error `StorageApiError: new row violates row-level security policy` occurs because the Supabase storage bucket doesn't have the proper RLS policies configured for authenticated users.

## Solution Steps

### 1. Create Storage Bucket (if not exists)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Set the following:
   - **Name**: `images`
   - **Public**: ✅ **Yes** (check this box)
   - **File size limit**: 50MB (or your preferred limit)
   - **Allowed MIME types**: `image/*` (optional)

### 2. Apply RLS Policies

Run the SQL commands from `database/storage_policies.sql` in your Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );

-- Policy to allow authenticated users to view images
CREATE POLICY "Authenticated users can view images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );

-- Policy to allow authenticated users to update images
CREATE POLICY "Authenticated users can update images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );
```

### 3. Alternative: Disable RLS for Storage (Not Recommended)

If you want to disable RLS for storage (less secure), you can run:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: This makes your storage bucket accessible to anyone with the URL.

### 4. Verify Setup

After applying the policies, test the image upload functionality:

1. Go to **Admin > Purchases > New Purchase**
2. Try uploading an image
3. Check the browser console for any errors
4. Verify the image appears in the **Storage > images** bucket in Supabase

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**
   - Ensure the `images` bucket exists in Supabase Storage
   - Check the bucket name matches exactly

2. **"Permission denied" error**
   - Verify RLS policies are applied correctly
   - Check that the user is authenticated
   - Ensure the bucket is public

3. **"File too large" error**
   - Check file size limits in bucket settings
   - Verify the file is under 10MB (as set in the code)

### Debug Steps

1. **Check Authentication**:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user);
   ```

2. **Test Storage Access**:
   ```javascript
   const { data, error } = await supabase.storage
     .from('images')
     .list('purchase-invoices', { limit: 1 });
   console.log('Storage test:', { data, error });
   ```

3. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

## Security Considerations

### Recommended Approach
- Keep RLS enabled for security
- Use role-based policies for fine-grained control
- Regularly audit storage access

### Role-Based Policies (Optional)
If you want more granular control, you can replace the basic policies with role-based ones:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Create role-based policies
CREATE POLICY "Admins have full storage access" ON storage.objects
    FOR ALL USING (
        bucket_id = 'images' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Branch users can manage images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'images' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'branch')
        )
    );
```

## File Upload Features

The updated upload function now includes:

- ✅ **Authentication Check**: Verifies user is logged in
- ✅ **File Type Validation**: Only allows image files
- ✅ **File Size Validation**: Maximum 10MB per file
- ✅ **Better Error Messages**: Specific error descriptions
- ✅ **Debug Logging**: Console logs for troubleshooting
- ✅ **Graceful Error Handling**: Continues with other files if one fails

## Testing

After setup, test with different scenarios:

1. **Valid image upload** (should work)
2. **Invalid file type** (should show error)
3. **Oversized file** (should show error)
4. **Multiple files** (should handle partial failures)
5. **Unauthenticated user** (should show auth error)

The improved error handling will now show specific error messages instead of generic failures.
