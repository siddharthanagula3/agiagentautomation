// Check if user exists and create if needed
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 CHECKING AND CREATING USER');
console.log('=============================');

async function checkAndCreateUser() {
  try {
    const email = 'founders@agiagentautomation.com';
    const password = 'SId@8790';
    
    console.log('\n📊 STEP 1: Attempting to create user account');
    console.log('--------------------------------------------');
    
    // Try to sign up the user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Founders',
          role: 'admin'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError);
      
      if (signupError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, trying to sign in...');
        
        // Try to sign in
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (signinError) {
          console.error('❌ Sign in failed:', signinError);
          console.log('🔧 Possible issues:');
          console.log('1. Password is incorrect');
          console.log('2. User account is disabled');
          console.log('3. Email confirmation required');
          console.log('4. Account doesn\'t exist');
        } else {
          console.log('✅ Sign in successful');
          console.log('👤 User ID:', signinData.user?.id);
          console.log('📧 Email:', signinData.user?.email);
          console.log('🔐 Email confirmed:', signinData.user?.email_confirmed_at ? 'Yes' : 'No');
        }
      }
    } else {
      console.log('✅ User created successfully');
      console.log('👤 User ID:', signupData.user?.id);
      console.log('📧 Email:', signupData.user?.email);
      console.log('🔐 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      if (!signupData.user?.email_confirmed_at) {
        console.log('⚠️  Email confirmation required');
        console.log('🔧 Check your email for confirmation link');
      }
    }
    
    console.log('\n📊 STEP 2: Testing with demo credentials');
    console.log('---------------------------------------');
    
    // Test with demo credentials
    const { data: demoData, error: demoError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123',
    });
    
    if (demoError) {
      console.log('ℹ️  Demo credentials not working (expected in production)');
    } else {
      console.log('✅ Demo credentials working');
    }
    
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('==================');
    console.log('1. If user creation failed, check Supabase Auth settings');
    console.log('2. If email confirmation required, check email inbox');
    console.log('3. If password incorrect, reset password in Supabase dashboard');
    console.log('4. Check Supabase Auth logs for more details');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAndCreateUser();
