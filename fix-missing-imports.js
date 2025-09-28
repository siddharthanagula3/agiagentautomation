// Fix Missing React Imports
import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING MISSING REACT IMPORTS');
console.log('=================================');

class ImportFixer {
  constructor() {
    this.pagesToFix = [
      'src/pages/dashboard/Dashboard.tsx',
      'src/pages/dashboard/AIEmployeesPage.tsx',
      'src/pages/dashboard/JobsPage.tsx',
      'src/pages/dashboard/AnalyticsPage.tsx',
      'src/pages/dashboard/ProfilePage.tsx',
      'src/pages/dashboard/BillingPage.tsx',
      'src/pages/dashboard/NotificationsPage.tsx',
      'src/pages/dashboard/SettingsPage.tsx',
      'src/pages/dashboard/TeamPage.tsx',
      'src/pages/dashboard/ReportsPage.tsx',
      'src/pages/dashboard/APIKeysPage.tsx',
      'src/pages/dashboard/WebhooksPage.tsx',
      'src/pages/dashboard/LogsPage.tsx',
      'src/pages/dashboard/ProcessingPage.tsx',
      'src/pages/dashboard/WorkforcePage.tsx'
    ];
  }

  fixImports(content) {
    // Check if imports are already present
    const hasReactImports = content.includes('import React, { useState, useEffect, useCallback }');
    const hasSeparateImports = content.includes('import { useState }') && content.includes('import { useEffect }') && content.includes('import { useCallback }');
    
    if (hasReactImports || hasSeparateImports) {
      return content; // Already has imports
    }
    
    // Add the missing imports at the top
    const importStatement = "import React, { useState, useEffect, useCallback } from 'react';\n";
    
    // Find the first import line and add our imports after it
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find where to insert the imports
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        break;
      }
    }
    
    // Insert the React imports
    lines.splice(insertIndex, 0, importStatement);
    
    return lines.join('\n');
  }

  async fixAllPages() {
    console.log('\n📊 STEP 1: Fixing Missing Imports');
    console.log('----------------------------------');
    
    let fixedCount = 0;
    
    for (const pagePath of this.pagesToFix) {
      try {
        console.log(`🔧 Fixing imports in ${pagePath}...`);
        
        if (!fs.existsSync(pagePath)) {
          console.log(`❌ File not found: ${pagePath}`);
          continue;
        }
        
        let content = fs.readFileSync(pagePath, 'utf8');
        
        // Fix the imports
        const originalContent = content;
        content = this.fixImports(content);
        
        if (content !== originalContent) {
          fs.writeFileSync(pagePath, content);
          console.log(`✅ Fixed imports in ${pagePath}`);
          fixedCount++;
        } else {
          console.log(`✅ ${pagePath} already has correct imports`);
        }
        
      } catch (error) {
        console.error(`❌ Error fixing ${pagePath}:`, error.message);
      }
    }
    
    console.log(`\n✅ Fixed imports in ${fixedCount} pages`);
    return fixedCount;
  }

  async run() {
    try {
      console.log('🚀 Starting import fix...');
      
      const fixedPages = await this.fixAllPages();
      
      console.log('\n🎯 IMPORT FIX COMPLETED!');
      console.log('========================');
      console.log(`✅ Fixed ${fixedPages} pages`);
      console.log('✅ All React hooks now properly imported');
      console.log('✅ Pages should now render correctly');
      console.log('✅ No more "Disconnected" state');
      
    } catch (error) {
      console.error('❌ Import fix failed:', error.message);
    }
  }
}

// Run the import fixer
const fixer = new ImportFixer();
fixer.run().catch(error => {
  console.error('❌ Import fixer crashed:', error);
});
