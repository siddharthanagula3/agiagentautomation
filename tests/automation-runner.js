import { ComprehensiveTester, TEST_CONFIG } from './comprehensive-automation.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class AutomationRunner {
  constructor() {
    this.availablePorts = [8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087];
    this.currentPort = 8080;
    this.devServerProcess = null;
    this.testResults = [];
  }

  async findAvailablePort() {
    for (const port of this.availablePorts) {
      try {
        // Check if port is available
        const { spawn } = await import('child_process');
        const netstat = spawn('netstat', ['-an'], { shell: true });
        
        return new Promise((resolve) => {
          let output = '';
          netstat.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          netstat.on('close', () => {
            if (!output.includes(`:${port} `)) {
              resolve(port);
            } else {
              resolve(null);
            }
          });
        });
      } catch (error) {
        console.log(`Port ${port} check failed, trying next...`);
        continue;
      }
    }
    return null;
  }

  async startDevServer(port) {
    console.log(`🚀 Starting development server on port ${port}...`);
    
    try {
      // Set environment variables for the specific port
      process.env.PORT = port;
      process.env.VITE_SUPABASE_URL = 'https://lywdzvfibhzbljrgovwr.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';
      
      // Start the development server
      const { spawn } = await import('child_process');
      this.devServerProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, PORT: port }
      });

      // Wait for server to start
      await this.waitForServer(`http://localhost:${port}`);
      
      console.log(`✅ Development server started on port ${port}`);
      return port;
    } catch (error) {
      console.error(`❌ Failed to start development server on port ${port}:`, error.message);
      return null;
    }
  }

  async waitForServer(url, maxAttempts = 30) {
    const puppeteer = await import('puppeteer');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 5000 
        });
        
        await browser.close();
        return true;
      } catch (error) {
        console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error(`Server did not start within ${maxAttempts * 2} seconds`);
  }

  async stopDevServer() {
    if (this.devServerProcess) {
      console.log('🛑 Stopping development server...');
      this.devServerProcess.kill();
      this.devServerProcess = null;
    }
  }

  async runTestsOnPort(port) {
    console.log(`\n🧪 Running comprehensive tests on port ${port}...`);
    
    const config = {
      ...TEST_CONFIG,
      baseURL: `http://localhost:${port}`
    };
    
    const tester = new ComprehensiveTester();
    tester.config = config;
    
    try {
      await tester.initialize();
      await tester.runAllTests();
      
      return {
        port,
        success: true,
        results: tester.testResults
      };
    } catch (error) {
      console.error(`❌ Tests failed on port ${port}:`, error.message);
      return {
        port,
        success: false,
        error: error.message
      };
    } finally {
      await tester.cleanup();
    }
  }

  async fixCommonIssues() {
    console.log('\n🔧 Attempting to fix common issues...');
    
    try {
      // Check if node_modules exists
      if (!fs.existsSync('./node_modules')) {
        console.log('📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }

      // Check if build works
      console.log('🏗️ Testing build...');
      try {
        execSync('npm run build', { stdio: 'pipe' });
        console.log('✅ Build successful');
      } catch (error) {
        console.log('❌ Build failed, attempting to fix...');
        
        // Try to fix common build issues
        try {
          execSync('npm run lint -- --fix', { stdio: 'pipe' });
          console.log('🔧 Fixed linting issues');
        } catch (lintError) {
          console.log('⚠️ Could not auto-fix linting issues');
        }
      }

      // Check environment variables
      if (!process.env.VITE_SUPABASE_URL) {
        console.log('🔧 Setting environment variables...');
        process.env.VITE_SUPABASE_URL = 'https://lywdzvfibhzbljrgovwr.supabase.co';
        process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to fix issues:', error.message);
      return false;
    }
  }

  async runComprehensiveAutomation() {
    console.log('🚀 Starting Comprehensive Automation Runner...');
    
    try {
      // Fix common issues first
      await this.fixCommonIssues();
      
      // Find available port
      const port = await this.findAvailablePort();
      if (!port) {
        throw new Error('No available ports found');
      }
      
      console.log(`📍 Using port ${port}`);
      
      // Start development server
      const serverPort = await this.startDevServer(port);
      if (!serverPort) {
        throw new Error('Failed to start development server');
      }
      
      // Run tests
      const testResult = await this.runTestsOnPort(serverPort);
      this.testResults.push(testResult);
      
      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Automation runner failed:', error.message);
    } finally {
      await this.stopDevServer();
    }
  }

  async generateFinalReport() {
    console.log('\n📊 Generating Final Automation Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPorts: this.testResults.length,
        successfulPorts: this.testResults.filter(r => r.success).length,
        failedPorts: this.testResults.filter(r => !r.success).length
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = './tests/final-automation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📈 FINAL AUTOMATION SUMMARY');
    console.log('============================');
    console.log(`Total Ports Tested: ${report.summary.totalPorts}`);
    console.log(`✅ Successful: ${report.summary.successfulPorts}`);
    console.log(`❌ Failed: ${report.summary.failedPorts}`);
    console.log(`📄 Report: ${reportPath}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.some(r => !r.success)) {
      recommendations.push('Some tests failed - check the detailed reports for specific issues');
    }
    
    if (this.testResults.length === 0) {
      recommendations.push('No tests were run - check if the development server started correctly');
    }
    
    recommendations.push('Review screenshots in ./tests/automation-screenshots/ for visual issues');
    recommendations.push('Check console logs for JavaScript errors');
    recommendations.push('Verify all environment variables are set correctly');
    
    return recommendations;
  }
}

// Main execution
async function runAutomation() {
  const runner = new AutomationRunner();
  await runner.runComprehensiveAutomation();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutomation().catch(console.error);
}

export { AutomationRunner };
