/**
 * Chat Diagnostics - Run this in browser console to diagnose issues
 * 
 * How to use:
 * 1. Open your chat page
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy and paste this entire file
 * 5. Press Enter
 * 6. Share the output with debugging team
 */

(async function runChatDiagnostics() {
  console.log('🔍 STARTING CHAT DIAGNOSTICS...\n');
  console.log('='.repeat(50));

  const results = {
    environment: {},
    apiKeys: {},
    network: {},
    supabase: {},
    errors: []
  };

  // Test 1: Environment Variables
  console.log('\n📋 TEST 1: Environment Variables');
  console.log('-'.repeat(50));
  try {
    results.environment = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'MISSING',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      openaiKey: import.meta.env.VITE_OPENAI_API_KEY ? 'SET' : 'MISSING',
      anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
      googleKey: import.meta.env.VITE_GOOGLE_API_KEY ? 'SET' : 'MISSING',
      perplexityKey: import.meta.env.VITE_PERPLEXITY_API_KEY ? 'SET' : 'MISSING'
    };
    
    console.log('✅ Supabase URL:', results.environment.supabaseUrl);
    console.log(results.environment.supabaseKey === 'SET' ? '✅' : '❌', 'Supabase Key:', results.environment.supabaseKey);
    console.log(results.environment.openaiKey === 'SET' ? '✅' : '❌', 'OpenAI Key:', results.environment.openaiKey);
    console.log(results.environment.anthropicKey === 'SET' ? '✅' : '❌', 'Anthropic Key:', results.environment.anthropicKey);
    console.log(results.environment.googleKey === 'SET' ? '✅' : '❌', 'Google Key:', results.environment.googleKey);
    console.log(results.environment.perplexityKey === 'SET' ? '✅' : '❌', 'Perplexity Key:', results.environment.perplexityKey);
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    results.errors.push({ test: 'environment', error: error.message });
  }

  // Test 2: API Key Format Validation
  console.log('\n🔑 TEST 2: API Key Format Validation');
  console.log('-'.repeat(50));
  try {
    const validateKeyFormat = (key, prefix, name) => {
      if (!key) return `❌ ${name}: MISSING`;
      if (!key.startsWith(prefix)) return `⚠️ ${name}: Invalid format (should start with ${prefix})`;
      return `✅ ${name}: Valid format`;
    };

    if (import.meta.env.VITE_OPENAI_API_KEY) {
      console.log(validateKeyFormat(import.meta.env.VITE_OPENAI_API_KEY, 'sk-', 'OpenAI'));
    }
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      console.log(validateKeyFormat(import.meta.env.VITE_ANTHROPIC_API_KEY, 'sk-ant-', 'Anthropic'));
    }
    if (import.meta.env.VITE_GOOGLE_API_KEY) {
      console.log(validateKeyFormat(import.meta.env.VITE_GOOGLE_API_KEY, 'AIza', 'Google'));
    }
    if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
      console.log(validateKeyFormat(import.meta.env.VITE_PERPLEXITY_API_KEY, 'pplx-', 'Perplexity'));
    }
  } catch (error) {
    console.error('❌ Key format validation failed:', error);
    results.errors.push({ test: 'keyFormat', error: error.message });
  }

  // Test 3: Network Connectivity
  console.log('\n🌐 TEST 3: Network Connectivity');
  console.log('-'.repeat(50));
  
  // Test OpenAI
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    try {
      console.log('Testing OpenAI connection...');
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        }
      });
      results.network.openai = {
        reachable: true,
        status: response.status,
        ok: response.ok
      };
      console.log(response.ok ? '✅' : '❌', `OpenAI: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log('   Error:', error.error?.message || 'Unknown error');
      }
    } catch (error) {
      results.network.openai = { reachable: false, error: error.message };
      console.error('❌ OpenAI: Network error -', error.message);
    }
  }

  // Test Anthropic
  if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
    try {
      console.log('Testing Anthropic connection...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      results.network.anthropic = {
        reachable: true,
        status: response.status,
        ok: response.ok
      };
      console.log(response.ok ? '✅' : '❌', `Anthropic: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log('   Error:', error.error?.message || 'Unknown error');
      }
    } catch (error) {
      results.network.anthropic = { reachable: false, error: error.message };
      console.error('❌ Anthropic: Network error -', error.message);
    }
  }

  // Test Google
  if (import.meta.env.VITE_GOOGLE_API_KEY) {
    try {
      console.log('Testing Google/Gemini connection...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        }
      );
      results.network.google = {
        reachable: true,
        status: response.status,
        ok: response.ok
      };
      console.log(response.ok ? '✅' : '❌', `Google: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log('   Error:', error.error?.message || 'Unknown error');
      }
    } catch (error) {
      results.network.google = { reachable: false, error: error.message };
      console.error('❌ Google: Network error -', error.message);
    }
  }

  // Test 4: Supabase Connection
  console.log('\n🗄️ TEST 4: Supabase Connection');
  console.log('-'.repeat(50));
  try {
    // Dynamic import of supabase
    const { default: supabase } = await import('/src/integrations/supabase/client.ts');
    
    // Test authentication state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.supabase.authenticated = !!user;
    results.supabase.userId = user?.id || null;
    
    console.log(user ? '✅' : '⚠️', 'User authenticated:', user ? 'Yes' : 'No');
    if (user) {
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
    }

    // Test database access
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database access failed:', error.message);
        results.supabase.databaseAccess = false;
        results.supabase.databaseError = error.message;
      } else {
        console.log('✅ Database access successful');
        results.supabase.databaseAccess = true;
      }
    } catch (dbError) {
      console.error('❌ Database test failed:', dbError.message);
      results.supabase.databaseError = dbError.message;
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    results.errors.push({ test: 'supabase', error: error.message });
  }

  // Test 5: Check for Common Issues
  console.log('\n🔍 TEST 5: Common Issues Check');
  console.log('-'.repeat(50));
  
  // Check if dev server needs restart
  const envVarsSet = Object.values(results.environment).filter(v => v === 'SET').length;
  if (envVarsSet < 3) {
    console.warn('⚠️ WARNING: Less than 3 API keys configured. Add more keys to .env file and RESTART dev server.');
  }

  // Check network issues
  const networkTests = Object.keys(results.network).length;
  const networkFailures = Object.values(results.network).filter(v => !v.reachable).length;
  if (networkFailures === networkTests && networkTests > 0) {
    console.error('❌ CRITICAL: All API providers unreachable. Check your internet connection or firewall.');
  } else if (networkFailures > 0) {
    console.warn(`⚠️ WARNING: ${networkFailures} out of ${networkTests} API providers unreachable.`);
  }

  // Check Supabase
  if (!results.supabase.authenticated) {
    console.warn('⚠️ WARNING: Not logged into Supabase. Go to /auth/login.');
  }
  if (results.supabase.databaseError) {
    console.warn('⚠️ WARNING: Database access issue. Run supabase-schema.sql in Supabase SQL Editor.');
  }

  // Final Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log('Environment Variables:', envVarsSet, '/', Object.keys(results.environment).length - 1, 'configured');
  console.log('API Connectivity:', (networkTests - networkFailures), '/', networkTests, 'working');
  console.log('Supabase:', results.supabase.authenticated ? 'Logged in' : 'Not logged in');
  console.log('Database:', results.supabase.databaseAccess ? 'Accessible' : 'Not accessible');
  console.log('Errors:', results.errors.length);

  // Action Items
  console.log('\n✅ RECOMMENDED ACTIONS');
  console.log('='.repeat(50));
  const actions = [];
  
  if (envVarsSet < 3) {
    actions.push('1. Add more API keys to .env file');
    actions.push('2. Restart dev server with: npm run dev');
  }
  
  if (networkFailures > 0) {
    actions.push('3. Check internet connection');
    actions.push('4. Disable VPN/proxy if enabled');
    actions.push('5. Check firewall settings');
  }
  
  if (!results.supabase.authenticated) {
    actions.push('6. Log in at /auth/login');
  }
  
  if (results.supabase.databaseError) {
    actions.push('7. Run supabase-schema.sql in Supabase SQL Editor');
  }

  if (actions.length === 0) {
    console.log('✅ All checks passed! If still having issues:');
    console.log('   - Clear browser cache (Ctrl+Shift+R)');
    console.log('   - Check browser console for errors');
    console.log('   - Check Network tab for failed requests');
  } else {
    actions.forEach(action => console.log(action));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔍 DIAGNOSTICS COMPLETE');
  console.log('\nShare this output with your development team for debugging.');
  
  return results;
})();
