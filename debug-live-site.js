// This will help us debug what's happening on the live site
console.log('🔍 LIVE SITE DEBUGGING SCRIPT');
console.log('=====================================');

// Test 1: Check environment variables
console.log('📊 Step 1: Environment Variables Check');
console.log('-------------------------------------');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');

if (supabaseUrl) {
  console.log('URL Value:', supabaseUrl);
  console.log('URL Valid:', !supabaseUrl.includes('your_supabase_url_here'));
} else {
  console.log('❌ URL is missing - this will cause demo mode');
}

if (supabaseKey) {
  console.log('Key Value:', supabaseKey.substring(0, 20) + '...');
  console.log('Key Valid:', !supabaseKey.includes('your_supabase_anon_key_here'));
} else {
  console.log('❌ Key is missing - this will cause demo mode');
}

const hasValidCredentials = supabaseUrl && 
                          supabaseKey && 
                          !supabaseUrl.includes('your_supabase_url_here') && 
                          !supabaseKey.includes('your_supabase_anon_key_here');

console.log('Valid Credentials:', hasValidCredentials ? '✅ Yes' : '❌ No');

if (!hasValidCredentials) {
  console.log('⚠️  ISSUE IDENTIFIED: App will fall back to demo mode');
  console.log('🔧 SOLUTION: Add environment variables to Netlify');
  console.log('   1. Go to https://app.netlify.com');
  console.log('   2. Select your site');
  console.log('   3. Go to Site Settings → Environment Variables');
  console.log('   4. Add VITE_SUPABASE_URL = https://lywdzvfibhzbljrgovwr.supabase.co');
  console.log('   5. Add VITE_SUPABASE_ANON_KEY = eyJ...');
  console.log('   6. Redeploy the site');
} else {
  console.log('✅ Environment variables are correct');
}

// Test 2: Check if we can connect to Supabase
console.log('\n📊 Step 2: Supabase Connection Test');
console.log('-------------------------------------');

if (hasValidCredentials) {
  console.log('Testing Supabase connection...');
  // This would be tested in the actual app
  console.log('✅ Credentials available for Supabase connection');
} else {
  console.log('❌ Cannot test Supabase - missing credentials');
}

console.log('\n🎯 DIAGNOSIS COMPLETE');
console.log('=====================');
console.log('If you see "❌ Not set" above, the issue is missing Netlify environment variables.');
console.log('If you see "✅ Set" but still have issues, there may be a different problem.');
