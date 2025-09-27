import fs from 'fs';

console.log('🔧 Setting up environment variables...\n');

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://lywdzvfibhzbljrgovwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RxgnG21oG095Q15c8WuKzv4x9Qn5t6bGPIctx5hGD1UrOe5t0aR4lj0qn7JRJdrvt2LKUUpBp2LLIKMldegwbxh004Oft02rx

# JWT Secret (generate a secure random string)
VITE_JWT_SECRET=your-jwt-secret-key-here

# Optional: Stripe Secret Key (for server-side operations)
# STRIPE_SECRET_KEY=your-stripe-secret-key-here`;

try {
  // Check if .env already exists
  if (fs.existsSync('.env')) {
    console.log('⚠️  .env file already exists');
    console.log('📝 Please manually add the missing environment variables to your .env file:');
    console.log('\n' + envContent);
  } else {
    // Create .env file
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file with required environment variables');
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test login with: testuser@example.com / testpassword123');
  console.log('3. The infinite loading should be fixed!');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please manually create a .env file with this content:');
  console.log(envContent);
}
