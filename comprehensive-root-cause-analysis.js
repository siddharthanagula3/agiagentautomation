// Comprehensive Root Cause Analysis
import fs from 'fs';
import path from 'path';

console.log('🔍 COMPREHENSIVE ROOT CAUSE ANALYSIS');
console.log('====================================');

class RootCauseAnalyzer {
  constructor() {
    this.issues = [];
    this.files = [];
    this.backendIssues = [];
    this.reactIssues = [];
    this.importIssues = [];
  }

  async analyzeBackendConnection() {
    console.log('\n📊 STEP 1: Analyzing Backend Connection');
    console.log('---------------------------------------');
    
    try {
      // Check environment variables
      const envFile = '.env';
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        console.log('✅ .env file exists');
        console.log('📄 Environment variables:');
        console.log(envContent);
      } else {
        console.log('❌ .env file not found');
        this.issues.push('Missing .env file');
      }
      
      // Check Supabase configuration
      const supabaseClient = 'src/integrations/supabase/client.ts';
      if (fs.existsSync(supabaseClient)) {
        const clientContent = fs.readFileSync(supabaseClient, 'utf8');
        console.log('✅ Supabase client exists');
        console.log('📄 Supabase client content:');
        console.log(clientContent.substring(0, 500) + '...');
      } else {
        console.log('❌ Supabase client not found');
        this.issues.push('Missing Supabase client');
      }
      
      // Check services
      const servicesDir = 'src/services';
      if (fs.existsSync(servicesDir)) {
        const serviceFiles = fs.readdirSync(servicesDir);
        console.log(`✅ Services directory exists with ${serviceFiles.length} files`);
        console.log('📄 Service files:', serviceFiles);
        
        // Check a few key services
        const keyServices = ['authService.ts', 'agentsService.ts', 'jobsService.ts'];
        for (const service of keyServices) {
          const servicePath = path.join(servicesDir, service);
          if (fs.existsSync(servicePath)) {
            const serviceContent = fs.readFileSync(servicePath, 'utf8');
            console.log(`✅ ${service} exists`);
            console.log(`📄 ${service} content (first 300 chars):`);
            console.log(serviceContent.substring(0, 300) + '...');
          } else {
            console.log(`❌ ${service} not found`);
            this.issues.push(`Missing ${service}`);
          }
        }
      } else {
        console.log('❌ Services directory not found');
        this.issues.push('Missing services directory');
      }
      
    } catch (error) {
      console.error('❌ Backend analysis failed:', error.message);
      this.backendIssues.push(error.message);
    }
  }

  async analyzeReactIssues() {
    console.log('\n📊 STEP 2: Analyzing React Issues');
    console.log('----------------------------------');
    
    try {
      // Check main App.tsx
      const appFile = 'src/App.tsx';
      if (fs.existsSync(appFile)) {
        const appContent = fs.readFileSync(appFile, 'utf8');
        console.log('✅ App.tsx exists');
        console.log('📄 App.tsx content:');
        console.log(appContent);
        
        // Check for common React issues
        if (appContent.includes('useState') && !appContent.includes('import { useState }')) {
          this.reactIssues.push('Missing useState import');
        }
        if (appContent.includes('useEffect') && !appContent.includes('import { useEffect }')) {
          this.reactIssues.push('Missing useEffect import');
        }
        if (appContent.includes('useCallback') && !appContent.includes('import { useCallback }')) {
          this.reactIssues.push('Missing useCallback import');
        }
      } else {
        console.log('❌ App.tsx not found');
        this.issues.push('Missing App.tsx');
      }
      
      // Check main.tsx
      const mainFile = 'src/main.tsx';
      if (fs.existsSync(mainFile)) {
        const mainContent = fs.readFileSync(mainFile, 'utf8');
        console.log('✅ main.tsx exists');
        console.log('📄 main.tsx content:');
        console.log(mainContent);
      } else {
        console.log('❌ main.tsx not found');
        this.issues.push('Missing main.tsx');
      }
      
    } catch (error) {
      console.error('❌ React analysis failed:', error.message);
      this.reactIssues.push(error.message);
    }
  }

  async analyzeImports() {
    console.log('\n📊 STEP 3: Analyzing Import Issues');
    console.log('-----------------------------------');
    
    try {
      // Check package.json for dependencies
      const packageFile = 'package.json';
      if (fs.existsSync(packageFile)) {
        const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        console.log('✅ package.json exists');
        console.log('📄 Dependencies:');
        console.log(JSON.stringify(packageContent.dependencies, null, 2));
        
        // Check for missing dependencies
        const requiredDeps = ['react', 'react-dom', '@supabase/supabase-js'];
        for (const dep of requiredDeps) {
          if (!packageContent.dependencies[dep]) {
            this.importIssues.push(`Missing dependency: ${dep}`);
          }
        }
      } else {
        console.log('❌ package.json not found');
        this.issues.push('Missing package.json');
      }
      
      // Check TypeScript configuration
      const tsconfigFile = 'tsconfig.json';
      if (fs.existsSync(tsconfigFile)) {
        const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf8');
        console.log('✅ tsconfig.json exists');
        console.log('📄 TypeScript config:');
        console.log(tsconfigContent);
      } else {
        console.log('❌ tsconfig.json not found');
        this.issues.push('Missing tsconfig.json');
      }
      
    } catch (error) {
      console.error('❌ Import analysis failed:', error.message);
      this.importIssues.push(error.message);
    }
  }

  async analyzeDashboardPages() {
    console.log('\n📊 STEP 4: Analyzing Dashboard Pages');
    console.log('------------------------------------');
    
    const dashboardDir = 'src/pages/dashboard';
    if (fs.existsSync(dashboardDir)) {
      const pageFiles = fs.readdirSync(dashboardDir);
      console.log(`✅ Dashboard directory exists with ${pageFiles.length} files`);
      
      // Analyze each page file
      for (const file of pageFiles) {
        if (file.endsWith('.tsx')) {
          const filePath = path.join(dashboardDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          console.log(`\n📄 Analyzing ${file}:`);
          console.log('='.repeat(50));
          console.log(content);
          console.log('='.repeat(50));
          
          // Check for common issues
          if (content.includes('useState') && !content.includes('import { useState }')) {
            this.issues.push(`${file}: Missing useState import`);
          }
          if (content.includes('useEffect') && !content.includes('import { useEffect }')) {
            this.issues.push(`${file}: Missing useEffect import`);
          }
          if (content.includes('useCallback') && !content.includes('import { useCallback }')) {
            this.issues.push(`${file}: Missing useCallback import`);
          }
          if (content.includes('useAuth') && !content.includes('import { useAuth }')) {
            this.issues.push(`${file}: Missing useAuth import`);
          }
          if (content.includes('setLoading(false)') && content.includes('setLoading(true)')) {
            console.log(`✅ ${file}: Has loading state management`);
          } else {
            this.issues.push(`${file}: Missing proper loading state management`);
          }
        }
      }
    } else {
      console.log('❌ Dashboard directory not found');
      this.issues.push('Missing dashboard directory');
    }
  }

  async analyzeLayoutComponents() {
    console.log('\n📊 STEP 5: Analyzing Layout Components');
    console.log('--------------------------------------');
    
    const layoutFiles = [
      'src/layouts/DashboardLayout.tsx',
      'src/components/layout/DashboardHeader.tsx',
      'src/components/Sidebar.tsx',
      'src/components/Header.tsx'
    ];
    
    for (const file of layoutFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`\n📄 ${file}:`);
        console.log('='.repeat(50));
        console.log(content);
        console.log('='.repeat(50));
      } else {
        console.log(`❌ ${file} not found`);
        this.issues.push(`Missing ${file}`);
      }
    }
  }

  generateReport() {
    console.log('\n📊 STEP 6: Generating Analysis Report');
    console.log('------------------------------------');
    
    console.log('\n🎯 ROOT CAUSE ANALYSIS REPORT');
    console.log('============================');
    
    console.log(`\n📊 Total Issues Found: ${this.issues.length}`);
    console.log(`📊 Backend Issues: ${this.backendIssues.length}`);
    console.log(`📊 React Issues: ${this.reactIssues.length}`);
    console.log(`📊 Import Issues: ${this.importIssues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.backendIssues.length > 0) {
      console.log('\n🔧 BACKEND ISSUES:');
      this.backendIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.reactIssues.length > 0) {
      console.log('\n⚛️  REACT ISSUES:');
      this.reactIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.importIssues.length > 0) {
      console.log('\n📦 IMPORT ISSUES:');
      this.importIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    // Determine root cause
    if (this.issues.length === 0 && this.backendIssues.length === 0 && this.reactIssues.length === 0 && this.importIssues.length === 0) {
      console.log('\n✅ NO CRITICAL ISSUES FOUND');
      console.log('The issue might be in the component logic or data flow.');
    } else {
      console.log('\n🎯 ROOT CAUSE IDENTIFIED');
      console.log('Multiple issues found that need to be addressed.');
    }
  }

  async run() {
    try {
      console.log('🚀 Starting comprehensive root cause analysis...');
      
      await this.analyzeBackendConnection();
      await this.analyzeReactIssues();
      await this.analyzeImports();
      await this.analyzeDashboardPages();
      await this.analyzeLayoutComponents();
      this.generateReport();
      
      console.log('\n🎯 ROOT CAUSE ANALYSIS COMPLETED!');
      console.log('=================================');
      console.log('✅ All files analyzed');
      console.log('✅ Issues identified');
      console.log('✅ Report generated');
      
    } catch (error) {
      console.error('❌ Root cause analysis failed:', error.message);
    }
  }
}

// Run the root cause analyzer
const analyzer = new RootCauseAnalyzer();
analyzer.run().catch(error => {
  console.error('❌ Root cause analyzer crashed:', error);
});
