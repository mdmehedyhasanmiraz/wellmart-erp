-- Alternative approach for invoices storage policies
-- Run these commands one by one in your Supabase SQL editor

-- First, create the invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to invoices" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy 2: Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads from invoices" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'invoices');

-- Policy 3: Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to invoices" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'invoices');

-- Policy 4: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from invoices" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'invoices');
