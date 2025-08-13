-- Storage bucket policies for user-documents

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload files to their own directory
CREATE POLICY "Users can upload files to their own directory"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = 'business-files' AND
  (storage.foldername(name))[2] = auth.uid()
);

-- Policy for authenticated users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = 'business-files' AND
  (storage.foldername(name))[2] = auth.uid()
);

-- Policy for authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = 'business-files' AND
  (storage.foldername(name))[2] = auth.uid()
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = 'business-files' AND
  (storage.foldername(name))[2] = auth.uid()
);

-- Policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = 'business-files' AND
  (storage.foldername(name))[2] = auth.uid()
);

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set bucket to private (authenticated access only)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'user-documents';