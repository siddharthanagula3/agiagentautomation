import { AutomationRunner } from './automation-runner.js';
import { FunctionalTester } from './functional-tests.js';
import { execSync } from 'child_process';
import fs from 'fs';

class MasterTestRunner {
  constructor() {
    this.results = {
      automation: null,
      functional: null,
      e2e: null,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  async checkPrerequisites() {
    console.log('🔍 Checking Prerequisites...');
    
    try {
      // Check if node_modules exists
      if (!fs.existsSync('./node_modules')) {
        console.log('📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }

      // Check if build works
      console.log('🏗️ Testing build...');
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build successful');

      // Check environment variables
      if (!process.env.VITE_SUPABASE_URL) {
        console.log('⚠️ Environment variables not set. Please add them to your .env file.');
        console.log('📄 See tests/env-config-template.txt for the required variables.');
        return false;
      }

      console.log('✅ Prerequisites check passed');
      return true;
    } catch (error) {
      console.error('❌ Prerequisites check failed:', error.message);
      return false;
    }
  }

  async runAutomationTests() {
    console.log('\n🤖 Running Automation Tests...');
    const startTime = Date.now();
    
    try {
      const runner = new AutomationRunner();
      await runner.runComprehensiveAutomation();
      
      this.results.automation = {
        success: true,
        duration: Date.now() - startTime
      };
      
      console.log('✅ Automation tests completed');
    } catch (error) {
      this.results.automation = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
      console.error('❌ Automation tests failed:', error.message);
    }
  }

  async runFunctionalTests() {
    console.log('\n🔧 Running Functional Tests...');
    const startTime = Date.now();
    
    try {
      const tester = new FunctionalTester();
      await tester.runAllFunctionalTests();
      
      this.results.functional = {
        success: true,
        duration: Date.now() - startTime
      };
      
      console.log('✅ Functional tests completed');
    } catch (error) {
      this.results.functional = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
      console.error('❌ Functional tests failed:', error.message);
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running E2E Tests...');
    const startTime = Date.now();
    
    try {
      execSync('npm run test:e2e', { stdio: 'inherit' });
      
      this.results.e2e = {
        success: true,
        duration: Date.now() - startTime
      };
      
      console.log('✅ E2E tests completed');
    } catch (error) {
      this.results.e2e = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
      console.error('❌ E2E tests failed:', error.message);
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    console.log('🚀 Starting Master Test Runner...');
    console.log('=====================================');
    
    // Check prerequisites
    const prerequisitesOk = await this.checkPrerequisites();
    if (!prerequisitesOk) {
      console.log('\n❌ Prerequisites not met. Please fix the issues above and try again.');
      return;
    }

    // Run all test suites
    await this.runAutomationTests();
    await this.runFunctionalTests();
    await this.runE2ETests();

    // Calculate summary
    this.results.summary.duration = Date.now() - startTime;
    this.results.summary.total = 3;
    this.results.summary.passed = [
      this.results.automation,
      this.results.functional,
      this.results.e2e
    ].filter(r => r && r.success).length;
    this.results.summary.failed = this.results.summary.total - this.results.summary.passed;

    // Generate final report
    await this.generateFinalReport();
  }

  async generateFinalReport() {
    console.log('\n📊 MASTER TEST RUNNER RESULTS');
    console.log('===============================');
    console.log(`Total Test Suites: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⏱️  Total Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
    
    console.log('\n📋 Detailed Results:');
    console.log('---------------------');
    
    // Automation Tests
    if (this.results.automation) {
      const status = this.results.automation.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`🤖 Automation Tests: ${status} (${(this.results.automation.duration / 1000).toFixed(2)}s)`);
      if (this.results.automation.error) {
        console.log(`   Error: ${this.results.automation.error}`);
      }
    }
    
    // Functional Tests
    if (this.results.functional) {
      const status = this.results.functional.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`🔧 Functional Tests: ${status} (${(this.results.functional.duration / 1000).toFixed(2)}s)`);
      if (this.results.functional.error) {
        console.log(`   Error: ${this.results.functional.error}`);
      }
    }
    
    // E2E Tests
    if (this.results.e2e) {
      const status = this.results.e2e.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`🌐 E2E Tests: ${status} (${(this.results.e2e.duration / 1000).toFixed(2)}s)`);
      if (this.results.e2e.error) {
        console.log(`   Error: ${this.results.e2e.error}`);
      }
    }

    // Save report
    const report = {
      ...this.results,
      timestamp: new Date().toISOString(),
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync('./tests/master-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Master report saved: ./tests/master-test-report.json');
    
    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.failed > 0) {
      recommendations.push('Some test suites failed - review the detailed reports for specific issues');
    }
    
    if (!process.env.VITE_SUPABASE_URL) {
      recommendations.push('Set up environment variables using the template in tests/env-config-template.txt');
    }
    
    recommendations.push('Check screenshots in ./tests/automation-screenshots/ and ./tests/functional-screenshots/');
    recommendations.push('Review console logs for JavaScript errors');
    recommendations.push('Verify Supabase authentication settings include localhost URLs');
    
    if (this.results.automation && !this.results.automation.success) {
      recommendations.push('Fix automation test issues - check if development server starts correctly');
    }
    
    if (this.results.functional && !this.results.functional.success) {
      recommendations.push('Fix functional test issues - check form interactions and button clicks');
    }
    
    if (this.results.e2e && !this.results.e2e.success) {
      recommendations.push('Fix E2E test issues - check authentication and page navigation');
    }
    
    return recommendations;
  }
}

// Main execution
async function runMasterTests() {
  const runner = new MasterTestRunner();
  await runner.runAllTests();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMasterTests().catch(console.error);
}

export { MasterTestRunner };
