#!/usr/bin/env node

/**
 * Supabase Configuration Verification Script
 * 
 * This script helps verify that your Supabase environment variables are correct.
 * Run this locally to test your configuration before deploying to Netlify.
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔍 Supabase Configuration Verification');
console.log('=====================================\n');

// Check if variables are set
console.log('📋 Environment Variables:');
console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Not set'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables!');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Validate URL format
const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
if (!urlPattern.test(supabaseUrl)) {
  console.log('❌ Invalid Supabase URL format!');
  console.log('Expected format: https://your-project-id.supabase.co');
  console.log(`Got: ${supabaseUrl}`);
  process.exit(1);
}

// Validate key format
const keyPattern = /^eyJ[A-Za-z0-9-_]+$/;
if (!keyPattern.test(supabaseKey)) {
  console.log('❌ Invalid Supabase key format!');
  console.log('Expected JWT format starting with "eyJ"');
  console.log(`Got: ${supabaseKey.substring(0, 20)}...`);
  process.exit(1);
}

console.log('✅ Environment variables format looks correct!\n');

// Test Supabase connection
console.log('🔗 Testing Supabase connection...');

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test basic connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.log('❌ Supabase connection failed:');
      console.log(`Error: ${error.message}`);
      process.exit(1);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('🎉 Your configuration is correct!');
      console.log('\n📋 Next steps:');
      console.log('1. Add these variables to Netlify dashboard');
      console.log('2. Trigger a new deploy');
      console.log('3. Test your login page');
    }
  }).catch((err) => {
    console.log('❌ Connection test failed:');
    console.log(`Error: ${err.message}`);
    process.exit(1);
  });
  
} catch (error) {
  console.log('❌ Failed to create Supabase client:');
  console.log(`Error: ${error.message}`);
  process.exit(1);
}
