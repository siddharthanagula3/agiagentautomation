// This script will help us test what environment variables are available on the live site
console.log('🔍 Testing Live Site Environment Variables...')

// Check if we can access the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment Variables on Live Site:')
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')

if (supabaseUrl) {
  console.log('- URL Value:', supabaseUrl)
}

if (supabaseKey) {
  console.log('- Key Value:', supabaseKey.substring(0, 20) + '...')
}

const hasValidCredentials = supabaseUrl && 
                          supabaseKey && 
                          !supabaseUrl.includes('your_supabase_url_here') && 
                          !supabaseKey.includes('your_supabase_anon_key_here');

console.log('Valid Credentials:', hasValidCredentials ? 'Yes' : 'No')

if (!hasValidCredentials) {
  console.log('⚠️  This will cause the app to fall back to demo mode')
  console.log('🔧 Check Netlify environment variables:')
  console.log('   1. Go to https://app.netlify.com')
  console.log('   2. Select your site')
  console.log('   3. Go to Site Settings → Environment Variables')
  console.log('   4. Verify these variables exist:')
  console.log('      - VITE_SUPABASE_URL = https://lywdzvfibhzbljrgovwr.supabase.co')
  console.log('      - VITE_SUPABASE_ANON_KEY = eyJ...')
  console.log('   5. Redeploy the site')
} else {
  console.log('✅ Environment variables look correct')
}
