// Cleanup temporary files
import fs from 'fs';

const tempFiles = [
  'check-schema-direct.js',
  'check-schema.js', 
  'clean-dashboard-pages.js',
  'final-test.js',
  'final-verification.js',
  'fix-dashboard-auth.js',
  'fix-dashboard-pages.js',
  'fix-duplicate-user.js',
  'fix-error-states.js',
  'fix-remaining-mock-data.js',
  'fix-service-syntax.js',
  'fix-services-real-data.js',
  'fix-usage-table.js',
  'fix-usage-tracking.js',
  'functionality-test.js',
  'production-test.js',
  'remove-mock-data.js',
  'security-audit.js',
  'setup-supabase.js',
  'test-dashboard-services.js',
  'test-tables.js',
  'complete-schema-fix.sql',
  'fix-schema.sql',
  'supabase-complete-setup.sql',
  'src/services/billingService-clean.ts',
  'cleanup-temp-files.js'
];

console.log('🧹 Cleaning up temporary files...\n');

let deleted = 0;
let notFound = 0;

tempFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted ${file}`);
      deleted++;
    } else {
      console.log(`ℹ️  ${file} not found`);
      notFound++;
    }
  } catch (error) {
    console.log(`❌ Error deleting ${file}: ${error.message}`);
  }
});

console.log(`\n📊 Summary: ${deleted} files deleted, ${notFound} files not found`);
console.log('\n✅ Cleanup completed');
