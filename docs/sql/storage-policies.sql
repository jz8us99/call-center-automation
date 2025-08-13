-- Storage policies for user-documents bucket
-- This script creates the necessary RLS policies for file uploads

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload files to their own directories
CREATE POLICY "Users can upload files to their own directory"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.uid() IS NOT NULL
  AND name LIKE 'business-files/' || auth.uid()::text || '/%'
);

-- Policy for users to read/view files from their own directories
CREATE POLICY "Users can view files from their own directory"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-documents'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'business-files/' || auth.uid()::text || '/%'
);

-- Policy for users to update/replace files in their own directories
CREATE POLICY "Users can update files in their own directory"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-documents'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'business-files/' || auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'user-documents'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'business-files/' || auth.uid()::text || '/%'
);

-- Policy for users to delete files from their own directories
CREATE POLICY "Users can delete files from their own directory"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-documents'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'business-files/' || auth.uid()::text || '/%'
);

-- Optional: Policy for admins to access all files
CREATE POLICY "Admins can access all files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'user-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
  )
)
WITH CHECK (
  bucket_id = 'user-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
  )
);

-- Ensure the bucket exists (create if it doesn't)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to the bucket (for file downloads via public URLs)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-documents';