require('dotenv').config();

console.log('🔍 Testing Supabase Connection Configuration\n');
console.log('='.repeat(50));

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n📋 Environment Variable Status:');
console.log('--------------------------------');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');

// Check for placeholder values
const hasPlaceholders = 
  supabaseUrl?.includes('your_supabase_url_here') || 
  supabaseKey?.includes('your_supabase_anon_key_here');

if (hasPlaceholders) {
  console.log('\n⚠️  WARNING: Placeholder values detected!');
  console.log('\n🔧 DEMO MODE ACTIVE');
  console.log('-------------------');
  console.log('The app will run in demo mode with limited functionality.');
  console.log('\nDemo Login Credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo123');
  console.log('\nTo enable full functionality:');
  console.log('1. Create account at https://supabase.com');
  console.log('2. Get credentials from Settings → API');
  console.log('3. Update .env file with real values');
  console.log('4. Restart the development server');
} else if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ ERROR: Missing environment variables!');
  console.log('\nPlease configure your .env file.');
  console.log('Copy .env.example to .env and update the values.');
} else {
  console.log('\n✅ Configuration looks good!');
  console.log('\n📡 Supabase Details:');
  console.log('--------------------');
  console.log('URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  console.log('\nThe app should connect to Supabase successfully.');
}

console.log('\n' + '='.repeat(50));
console.log('\n🚀 Run "npm run dev" to start the application');
console.log('\n');
