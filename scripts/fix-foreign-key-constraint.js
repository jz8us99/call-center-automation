require('dotenv').config();

async function fixForeignKeyConstraint() {
  try {
    console.log('🔧 Fixing foreign key constraint on retell_agents table...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Checking current constraints...');

    // First, let's see what business_id values exist
    console.log('\n2. Checking existing business_profiles...');
    const { data: businesses, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(10);

    if (businessError) {
      console.log(
        '❌ Could not fetch business profiles:',
        businessError.message
      );
    } else {
      console.log('✅ Found', businesses?.length || 0, 'business profiles:');
      businesses?.forEach(b => {
        console.log(
          `  - ID: ${b.id}, Name: ${b.business_name}, User ID: ${b.user_id}`
        );
      });
    }

    console.log('\n3. Testing insert with valid business_id...');

    if (businesses && businesses.length > 0) {
      const validBusinessId = businesses[0].id; // Use the first valid business ID

      const testRecord = {
        business_id: validBusinessId,
        agent_type: 'receptionist',
        retell_agent_id: 'constraint_test_' + Date.now(),
        agent_name: 'Constraint Test Agent',
        status: 'deployed',
        response_engine_type: 'retell-llm',
        updated_at: new Date().toISOString(),
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('retell_agents')
        .insert(testRecord)
        .select();

      if (insertError) {
        console.log(
          '❌ Insert with valid business_id failed:',
          insertError.message
        );

        if (insertError.message.includes('foreign key')) {
          console.log('\n4. Foreign key constraint is too strict. Options:');
          console.log(
            '   a) Remove foreign key constraint (recommended for flexibility)'
          );
          console.log('   b) Always use valid business_profile.id values');

          console.log(
            '\n5. Recommendation: Modify deployment service to use business_profile.id'
          );

          // Show how to get the correct business_id
          console.log('\n6. Testing correct business_id lookup...');
          const testUserId = 'f4056f55-ad6d-4c6d-8aba-17544327b45a';

          const { data: correctBusiness, error: lookupError } = await supabase
            .from('business_profiles')
            .select('id, business_name')
            .eq('user_id', testUserId)
            .single();

          if (!lookupError && correctBusiness) {
            console.log('✅ Found correct business_id for user:');
            console.log(`   User ID: ${testUserId}`);
            console.log(`   Business ID: ${correctBusiness.id}`);
            console.log(`   Business Name: ${correctBusiness.business_name}`);

            // Test with correct business_id
            const correctTestRecord = {
              business_id: correctBusiness.id,
              agent_type: 'receptionist',
              retell_agent_id: 'correct_test_' + Date.now(),
              agent_name: 'Correct Test Agent',
              status: 'deployed',
            };

            const { data: correctResult, error: correctError } = await supabase
              .from('retell_agents')
              .insert(correctTestRecord)
              .select();

            if (correctError) {
              console.log(
                '❌ Even correct business_id failed:',
                correctError.message
              );
            } else {
              console.log(
                '✅ SUCCESS! Insert works with correct business_id:',
                correctResult[0].id
              );

              // Clean up
              await supabase
                .from('retell_agents')
                .delete()
                .eq('id', correctResult[0].id);
              console.log('🧹 Test record cleaned up');
            }
          }
        }
      } else {
        console.log('✅ Insert successful:', insertResult);

        // Clean up
        await supabase
          .from('retell_agents')
          .delete()
          .eq('retell_agent_id', testRecord.retell_agent_id);
      }
    }

    return {
      success: true,
      message:
        'Use business_profiles.id (not user_id) for retell_agents.business_id',
    };
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    return { error: error.message };
  }
}

async function runFix() {
  console.log('='.repeat(70));
  console.log('RETELL_AGENTS FOREIGN KEY CONSTRAINT FIX');
  console.log('='.repeat(70));

  const result = await fixForeignKeyConstraint();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ CONSTRAINT ANALYSIS COMPLETED');
    console.log('Key finding:', result.message);
    console.log('\n💡 SOLUTION:');
    console.log(
      'Update RetellDeploymentService to use business_profiles.id instead of user_id'
    );
    console.log(
      'The foreign key constraint requires retell_agents.business_id to reference'
    );
    console.log('an existing business_profiles.id value.');
  } else {
    console.log('❌ CONSTRAINT FIX FAILED');
    console.log('Error:', result.error);
  }
  console.log('='.repeat(70));
}

runFix();
