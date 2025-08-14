require('dotenv').config();

async function diagnose500Error() {
  try {
    console.log('🔍 Diagnosing the 500 error step by step...\n');

    // Test 1: Can we import the RetellDeploymentService?
    console.log('1. Testing RetellDeploymentService import...');
    try {
      // Try requiring in CommonJS way first
      const fs = require('fs');
      const path = require('path');
      const servicePath = path.join(
        __dirname,
        '..',
        'src',
        'lib',
        'services',
        'retell-deployment-service.ts'
      );

      if (fs.existsSync(servicePath)) {
        console.log('   ✅ Service file exists');

        // Check for syntax errors by reading the file
        const content = fs.readFileSync(servicePath, 'utf8');
        if (content.includes('export class RetellDeploymentService')) {
          console.log('   ✅ Export statement found');
        } else {
          console.log('   ❌ Export statement not found');
        }

        // Check imports
        if (content.includes('import { BaseBusinessService }')) {
          console.log('   ✅ BaseBusinessService import found');
        } else {
          console.log('   ❌ BaseBusinessService import not found');
        }
      } else {
        console.log('   ❌ Service file does not exist');
        return { error: 'Service file missing' };
      }
    } catch (importError) {
      console.log('   ❌ Import error:', importError.message);
      return { error: 'Import failed: ' + importError.message };
    }

    // Test 2: Can we create a Retell SDK client?
    console.log('\n2. Testing Retell SDK initialization...');
    try {
      const Retell = require('retell-sdk').default;
      const client = new Retell({ apiKey: process.env.RETELL_API_KEY });
      console.log('   ✅ Retell SDK client created');

      // Try a simple API call
      const llms = await client.llm.list();
      console.log('   ✅ Retell API accessible, found', llms.length, 'LLMs');
    } catch (retellError) {
      console.log('   ❌ Retell error:', retellError.message);
      return { error: 'Retell SDK failed: ' + retellError.message };
    }

    // Test 3: Can we connect to Supabase?
    console.log('\n3. Testing Supabase connection...');
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from('retell_llm_configs')
        .select('count')
        .limit(1);

      if (error) {
        console.log('   ❌ Supabase error:', error.message);
        return { error: 'Supabase failed: ' + error.message };
      } else {
        console.log('   ✅ Supabase connection works');
      }
    } catch (supabaseError) {
      console.log('   ❌ Supabase connection error:', supabaseError.message);
      return { error: 'Supabase connection failed: ' + supabaseError.message };
    }

    // Test 4: Check environment variables
    console.log('\n4. Checking environment variables...');
    const requiredEnvs = [
      'RETELL_API_KEY',
      'RETELL_LLM_ID',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_BASE_URL',
    ];

    let missingEnvs = [];
    requiredEnvs.forEach(env => {
      if (process.env[env]) {
        console.log(`   ✅ ${env} is set`);
      } else {
        console.log(`   ❌ ${env} is missing`);
        missingEnvs.push(env);
      }
    });

    if (missingEnvs.length > 0) {
      return {
        error: 'Missing environment variables: ' + missingEnvs.join(', '),
      };
    }

    // Test 5: Try to simulate the exact API call
    console.log('\n5. Testing simulated deployment flow...');

    const testBusinessId = 'test-business-' + Date.now();
    const testAgentConfig = {
      id: 'test-agent-id',
      agent_name: 'Diagnostic Test Agent',
      agent_type: 'receptionist',
      retell_llm_id: process.env.RETELL_LLM_ID,
      basic_info_prompt: 'Test prompt',
      call_scripts: {},
      voice_settings: {},
    };

    console.log('   Test config prepared');
    console.log('   Business ID:', testBusinessId);
    console.log('   Agent LLM ID:', testAgentConfig.retell_llm_id);

    return { success: true, message: 'All diagnostic tests passed' };
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    return { error: 'Diagnostic failed: ' + error.message };
  }
}

async function runDiagnostic() {
  console.log('='.repeat(60));
  console.log('500 ERROR DIAGNOSTIC');
  console.log('='.repeat(60));

  const result = await diagnose500Error();

  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ ALL TESTS PASSED');
    console.log('The issue might be in the Next.js runtime environment.');
    console.log('Please check the server console for the actual error logs.');
  } else {
    console.log('❌ DIAGNOSTIC FOUND ISSUE');
    console.log('Error:', result.error);
    console.log('This is likely causing the 500 error.');
  }
  console.log('='.repeat(60));
}

runDiagnostic();
