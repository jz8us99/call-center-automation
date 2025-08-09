import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Drop and recreate the table with correct structure
    const createTableQuery = `
      -- Drop existing table if it has wrong structure
      DROP TABLE IF EXISTS public.agent_configurations_scoped CASCADE;

      -- Create agent_configurations_scoped table with correct structure
      CREATE TABLE public.agent_configurations_scoped (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          client_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
          agent_type_id UUID REFERENCES public.agent_types(id) ON DELETE CASCADE,
          agent_name VARCHAR(255) NOT NULL,
          
          -- Basic information fields
          greeting_message TEXT,
          custom_instructions TEXT,
          basic_info_prompt TEXT,
          agent_personality VARCHAR(50) DEFAULT 'professional',
          
          -- Advanced prompt fields
          call_scripts_prompt TEXT,
          
          -- Configuration JSON fields
          call_scripts JSONB DEFAULT '{}',
          voice_settings JSONB DEFAULT '{}',
          call_routing JSONB DEFAULT '{}',
          custom_settings JSONB DEFAULT '{}',
          
          -- Template reference
          based_on_template_id UUID,
          
          -- Status
          is_active BOOLEAN DEFAULT true,
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          
          -- Unique constraint for one configuration per client per agent type
          UNIQUE(client_id, agent_type_id)
      );

      -- Create indexes for better performance
      CREATE INDEX idx_agent_configurations_client_id ON public.agent_configurations_scoped(client_id);
      CREATE INDEX idx_agent_configurations_agent_type_id ON public.agent_configurations_scoped(agent_type_id);
      CREATE INDEX idx_agent_configurations_active ON public.agent_configurations_scoped(is_active);

      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = TIMEZONE('utc', NOW());
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for agent_configurations_scoped
      CREATE TRIGGER update_agent_configurations_updated_at 
          BEFORE UPDATE ON public.agent_configurations_scoped 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

      -- Grant permissions
      GRANT ALL ON public.agent_configurations_scoped TO authenticated;

      -- Enable Row Level Security
      ALTER TABLE public.agent_configurations_scoped ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies for agent_configurations_scoped
      CREATE POLICY "Users can view their own agent configurations" ON public.agent_configurations_scoped
          FOR SELECT
          TO authenticated
          USING (
              client_id IN (
                  SELECT id FROM public.business_profiles 
                  WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can insert their own agent configurations" ON public.agent_configurations_scoped
          FOR INSERT
          TO authenticated
          WITH CHECK (
              client_id IN (
                  SELECT id FROM public.business_profiles 
                  WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can update their own agent configurations" ON public.agent_configurations_scoped
          FOR UPDATE
          TO authenticated
          USING (
              client_id IN (
                  SELECT id FROM public.business_profiles 
                  WHERE user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can delete their own agent configurations" ON public.agent_configurations_scoped
          FOR DELETE
          TO authenticated
          USING (
              client_id IN (
                  SELECT id FROM public.business_profiles 
                  WHERE user_id = auth.uid()
              )
          );
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('sql', { query: createTableQuery });

    if (error) {
      console.error('Error creating table:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Test the new table structure
    const testData = {
      client_id: '9aae05e7-744e-4897-b493-2e4dd1719caa', // From the business profiles we saw
      agent_type_id: 'a946c78f-b5ad-4789-9457-07f7b58c32d4', // inbound_receptionist
      agent_name: 'Test Agent',
      greeting_message: 'Hello! Welcome to our business.',
      custom_instructions: 'Be professional and helpful.',
      basic_info_prompt: 'You are a professional receptionist.',
      agent_personality: 'professional',
    };

    const { data: testInsert, error: insertError } = await supabase
      .from('agent_configurations_scoped')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('Test insert error:', insertError);
    }

    return NextResponse.json({
      success: true,
      message:
        'Agent configurations table created successfully with all required fields',
      test_insert: {
        success: !insertError,
        error: insertError?.message || null,
        data: testInsert,
      },
    });
  } catch (error) {
    console.error('Error in create-agent-config-table:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
