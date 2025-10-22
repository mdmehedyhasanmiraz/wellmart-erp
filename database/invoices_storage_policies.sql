-- Storage policies for invoices bucket
-- This file should be run in your Supabase SQL editor

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create invoices bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to invoices bucket
CREATE POLICY "Authenticated users can upload invoices" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'invoices' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to view files in invoices bucket
CREATE POLICY "Authenticated users can view invoices" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'invoices' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update files in invoices bucket
CREATE POLICY "Authenticated users can update invoices" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'invoices' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete files in invoices bucket
CREATE POLICY "Authenticated users can delete invoices" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'invoices' 
        AND auth.role() = 'authenticated'
    );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
