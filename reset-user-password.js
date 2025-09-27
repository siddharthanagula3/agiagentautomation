// Reset user password script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 PASSWORD RESET SOLUTION');
console.log('===========================');

async function resetPassword() {
  try {
    const email = 'founders@agiagentautomation.com';
    
    console.log('\n📊 STEP 1: Sending password reset email');
    console.log('---------------------------------------');
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://agiagentautomation.com/auth/reset-password'
    });
    
    if (error) {
      console.error('❌ Password reset failed:', error);
      console.log('🔧 Manual steps required:');
      console.log('1. Go to https://supabase.com/dashboard/project/lywdzvfibhzbljrgovwr');
      console.log('2. Navigate to Authentication → Users');
      console.log('3. Find founders@agiagentautomation.com');
      console.log('4. Click "Reset Password" or "Update User"');
      console.log('5. Set new password: SId@8790');
      console.log('6. Save changes');
    } else {
      console.log('✅ Password reset email sent');
      console.log('📧 Check email for reset link');
      console.log('🔗 Reset link will redirect to: https://agiagentautomation.com/auth/reset-password');
    }
    
    console.log('\n📊 STEP 2: Alternative - Create New User');
    console.log('---------------------------------------');
    
    const newEmail = 'admin@agiagentautomation.com';
    const newPassword = 'SId@8790';
    
    console.log('🔧 Creating new admin user...');
    const { data: newUser, error: newUserError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        data: {
          full_name: 'Admin User',
          role: 'admin'
        }
      }
    });
    
    if (newUserError) {
      console.error('❌ New user creation failed:', newUserError);
    } else {
      console.log('✅ New admin user created');
      console.log('📧 Email:', newEmail);
      console.log('🔐 Password:', newPassword);
      console.log('⚠️  Check email for confirmation if required');
    }
    
    console.log('\n🎯 NEXT STEPS');
    console.log('=============');
    console.log('1. Either reset password for founders@agiagentautomation.com');
    console.log('2. Or use the new admin@agiagentautomation.com account');
    console.log('3. Test login on the website');
    console.log('4. Console errors should be resolved');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

resetPassword();
