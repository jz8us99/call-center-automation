-- Add direction column to agent_types table
ALTER TABLE agent_types 
ADD COLUMN IF NOT EXISTS direction VARCHAR(20) DEFAULT 'inbound' 
CHECK (direction IN ('inbound', 'outbound', 'both'));

-- Update existing agent types with appropriate directions
UPDATE agent_types 
SET direction = CASE 
    WHEN type_code = 'router' THEN 'inbound'
    WHEN type_code = 'receptionist' THEN 'inbound'
    WHEN type_code = 'customer_support' THEN 'inbound'
    WHEN type_code = 'sales' THEN 'outbound'
    WHEN type_code = 'follow_up' THEN 'outbound'
    ELSE 'inbound'
END
WHERE direction IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN agent_types.direction IS 'Call direction: inbound (receives calls), outbound (makes calls), or both';

-- Create or update router agent type specifically
INSERT INTO agent_types (type_code, name, description, is_active, direction)
VALUES (
    'router',
    'Router Agent',
    'Intelligent call routing agent that directs calls to appropriate specialized agents',
    true,
    'inbound'
)
ON CONFLICT (type_code) 
DO UPDATE SET 
    direction = 'inbound',
    description = 'Intelligent call routing agent that directs calls to appropriate specialized agents';