console.log('=====================================');
console.log('🔧 ENVIRONMENT CONFIGURATION CHECK');
console.log('=====================================\n');

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Check for placeholder values
const hasPlaceholderUrl = !supabaseUrl || 
                         supabaseUrl.includes('your_supabase_url_here') || 
                         supabaseUrl.includes('placeholder');
const hasPlaceholderKey = !supabaseKey || 
                         supabaseKey.includes('your_supabase_anon_key_here') || 
                         supabaseKey.includes('placeholder');

const isDemoMode = hasPlaceholderUrl || hasPlaceholderKey;

console.log('📊 Configuration Status:');
console.log('------------------------');
console.log(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Not set'}`);

if (hasPlaceholderUrl) {
  console.log('⚠️  URL contains placeholder values');
}
if (hasPlaceholderKey) {
  console.log('⚠️  Key contains placeholder values');
}

console.log(`\nMode: ${isDemoMode ? '🟡 DEMO MODE' : '🟢 PRODUCTION MODE'}`);

if (isDemoMode) {
  console.log('\n⚠️  DEMO MODE ACTIVE');
  console.log('-------------------');
  console.log('The app is running in demo mode because:');
  if (hasPlaceholderUrl) {
    console.log('  ❌ VITE_SUPABASE_URL contains placeholder values');
  }
  if (hasPlaceholderKey) {
    console.log('  ❌ VITE_SUPABASE_ANON_KEY contains placeholder values');
  }
  console.log('\n🔧 To switch to Production Mode:');
  console.log('1. Get real Supabase credentials from https://supabase.com');
  console.log('2. Update your .env file with real values');
  console.log('3. Restart your development server');
  console.log('4. Update Netlify environment variables');
  console.log('\n📖 See ENVIRONMENT_SETUP_GUIDE.md for detailed instructions');
} else {
  console.log('\n✅ PRODUCTION MODE');
  console.log('------------------');
  console.log('Configuration looks good!');
  console.log('The app should connect to Supabase successfully.');
  console.log('\n🚀 Features enabled:');
  console.log('  ✅ Real user authentication');
  console.log('  ✅ Data persistence');
  console.log('  ✅ Full backend connectivity');
  console.log('  ✅ User registration and login');
}

// Check for other environment variables
console.log('\n📋 Other Environment Variables:');
console.log('--------------------------------');
const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
const jwtSecret = process.env.VITE_JWT_SECRET;

console.log(`Stripe Key: ${stripeKey ? '✅ Set' : '⚪ Not set (optional)'}`);
console.log(`JWT Secret: ${jwtSecret ? '✅ Set' : '⚪ Not set (optional)'}`);

console.log('\n🔍 Troubleshooting:');
console.log('-------------------');
if (isDemoMode) {
  console.log('If you want to use real authentication:');
  console.log('  1. Sign up at https://supabase.com');
  console.log('  2. Create a new project');
  console.log('  3. Get your Project URL and anon key');
  console.log('  4. Update .env file with real values');
  console.log('  5. Restart dev server: npm run dev');
} else {
  console.log('If you\'re having connection issues:');
  console.log('  1. Check your Supabase project is active');
  console.log('  2. Verify your credentials are correct');
  console.log('  3. Check your internet connection');
  console.log('  4. Look at browser console for errors');
}

console.log('\n📚 Documentation:');
console.log('------------------');
console.log('📖 ENVIRONMENT_SETUP_GUIDE.md - Complete setup guide');
console.log('🔧 npm run verify:login - Test login system');
console.log('🌐 https://supabase.com - Get Supabase credentials');

console.log('\n=====================================');
console.log(`${isDemoMode ? '⚠️  Demo Mode Active' : '✅ Configuration Complete'}`);
console.log('=====================================\n');
