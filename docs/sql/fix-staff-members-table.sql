-- Fix staff_members table structure to match API expectations

-- Add missing columns to staff_members table
ALTER TABLE staff_members 
ADD COLUMN IF NOT EXISTS title VARCHAR,
ADD COLUMN IF NOT EXISTS job_categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_types JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS first_name VARCHAR,
ADD COLUMN IF NOT EXISTS last_name VARCHAR,
ADD COLUMN IF NOT EXISTS email VARCHAR,
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS gender VARCHAR;

-- Drop old columns that were renamed
ALTER TABLE staff_members 
DROP COLUMN IF EXISTS staff_name CASCADE,
DROP COLUMN IF EXISTS staff_role CASCADE,
DROP COLUMN IF EXISTS staff_email CASCADE,
DROP COLUMN IF EXISTS staff_phone CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_members_job_categories ON staff_members USING gin(job_categories);
CREATE INDEX IF NOT EXISTS idx_staff_members_job_types ON staff_members USING gin(job_types);

-- Update RLS policies if needed
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can only access their own staff members" ON staff_members;

-- Create new RLS policy
CREATE POLICY "Users can only access their own staff members" 
ON staff_members 
FOR ALL 
USING (auth.uid() = user_id);

-- Add check constraint for gender
ALTER TABLE staff_members 
ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL);

-- Migrate data from old columns to new columns if they exist
DO $$ 
BEGIN
    -- Check if old columns exist and migrate data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'staff_name') THEN
        UPDATE staff_members 
        SET first_name = split_part(staff_name, ' ', 1),
            last_name = split_part(staff_name, ' ', 2)
        WHERE staff_name IS NOT NULL AND first_name IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'staff_email') THEN
        UPDATE staff_members SET email = staff_email WHERE staff_email IS NOT NULL AND email IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'staff_phone') THEN
        UPDATE staff_members SET phone = staff_phone WHERE staff_phone IS NOT NULL AND phone IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'staff_role') THEN
        UPDATE staff_members SET title = staff_role WHERE staff_role IS NOT NULL AND title IS NULL;
    END IF;
END $$;

-- Final cleanup: ensure NOT NULL constraints where needed
ALTER TABLE staff_members 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;