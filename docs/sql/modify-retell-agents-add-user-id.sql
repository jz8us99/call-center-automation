-- Modify retell_agents table to add user_id field and update RLS policies
-- Generated: 2025-08-15

-- Step 1: Add user_id column to retell_agents table (nullable initially)
ALTER TABLE retell_agents 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 3: Drop existing RLS policies for retell_agents
DROP POLICY IF EXISTS "Users can view their own retell agents" ON retell_agents;
DROP POLICY IF EXISTS "Users can manage their own retell agents" ON retell_agents;

-- Step 4: Create new RLS policies based on user_id only
-- business_id is kept for business logic but doesn't participate in RLS
CREATE POLICY "Users can view their own retell agents by user_id"
  ON retell_agents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own retell agents by user_id"
  ON retell_agents FOR ALL
  USING (user_id = auth.uid());

-- Step 5: Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_retell_agents_user_id ON retell_agents(user_id);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN retell_agents.user_id IS 'References the user who owns this retell agent, used for RLS policies';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'retell_agents' 
  AND column_name IN ('business_id', 'user_id')
ORDER BY ordinal_position;