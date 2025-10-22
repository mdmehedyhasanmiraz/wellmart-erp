-- Storage Bucket RLS Policies for WellMart ERP
-- Run these SQL commands in your Supabase SQL editor

-- First, ensure the 'images' bucket exists and is public
-- You can create it via Supabase Dashboard > Storage > Create Bucket
-- Name: images, Public: true

-- Enable RLS on storage.objects (this is usually enabled by default)
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

-- Optional: More restrictive policies based on user roles
-- Uncomment these if you want role-based storage access

-- Policy for admin users (full access)
-- CREATE POLICY "Admins have full storage access" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'images' 
--         AND EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- Policy for branch users (limited access)
-- CREATE POLICY "Branch users can manage images" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'images' 
--         AND EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE id = auth.uid() AND role IN ('admin', 'branch')
--         )
--     );

-- Additional bucket policies if you have other buckets
-- Replace 'other-bucket-name' with your actual bucket names

-- CREATE POLICY "Authenticated users can upload to other-bucket" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'other-bucket-name' 
--         AND auth.role() = 'authenticated'
--     );

-- CREATE POLICY "Authenticated users can view other-bucket" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'other-bucket-name' 
--         AND auth.role() = 'authenticated'
--     );
