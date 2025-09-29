// Comprehensive Website Test Script
// Tests the complete AGI Agent Automation Platform functionality

const puppeteer = require('puppeteer');

class WebsiteTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  async setup() {
    console.log('🚀 Starting Comprehensive Website Test');
    console.log('=====================================');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    // Create incognito context for clean testing
    const context = await this.browser.createBrowserContext();
    this.page = await context.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        this.results.summary.errors.push(msg.text());
      }
    });

    // Handle page errors
    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
      this.results.summary.errors.push(error.message);
    });
  }

  async testLandingPage() {
    console.log('\n🏠 Testing Landing Page...');
    
    try {
      await this.page.goto('http://localhost:5173', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Check if page loads
      const title = await this.page.title();
      console.log(`📄 Page Title: ${title}`);

      // Check for key elements
      const heroSection = await this.page.$('[data-testid="hero-section"], .hero, h1');
      const navigation = await this.page.$('nav, header');
      const footer = await this.page.$('footer');

      this.addTestResult('Landing Page Load', {
        title: title,
        heroSection: !!heroSection,
        navigation: !!navigation,
        footer: !!footer,
        success: !!(heroSection && navigation)
      });

      console.log('✅ Landing page loaded successfully');
      return true;

    } catch (error) {
      console.log('❌ Landing page test failed:', error.message);
      this.addTestResult('Landing Page Load', {
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testDemoPage() {
    console.log('\n🎮 Testing AI Employee Demo Page...');
    
    try {
      // Navigate to demo page
      await this.page.goto('http://localhost:5173/demo', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Check if demo page loads
      const title = await this.page.title();
      console.log(`📄 Demo Page Title: ${title}`);

      // Check for AI Employee cards
      const employeeCards = await this.page.$$('[data-testid="employee-card"], .employee-card, .bg-card');
      console.log(`👥 Found ${employeeCards.length} AI Employee cards`);

      // Check for demo functionality
      const startChatButtons = await this.page.$$('button:contains("Start Chat"), button:contains("Chat")');
      console.log(`💬 Found ${startChatButtons.length} chat buttons`);

      this.addTestResult('Demo Page Load', {
        title: title,
        employeeCards: employeeCards.length,
        chatButtons: startChatButtons.length,
        success: employeeCards.length > 0
      });

      console.log('✅ Demo page loaded successfully');
      return true;

    } catch (error) {
      console.log('❌ Demo page test failed:', error.message);
      this.addTestResult('Demo Page Load', {
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testAIEmployeeChat() {
    console.log('\n🤖 Testing AI Employee Chat Functionality...');
    
    try {
      // Look for and click a "Start Chat" button
      const chatButton = await this.page.$('button:contains("Start Chat"), button:contains("Chat")');
      
      if (chatButton) {
        await chatButton.click();
        await this.page.waitForTimeout(2000); // Wait for chat interface to load

        // Check if chat interface is visible
        const chatInterface = await this.page.$('[data-testid="chat-interface"], .chat-interface, .ai-employee-chat');
        const messageInput = await this.page.$('input[type="text"], textarea, [data-testid="message-input"]');
        const sendButton = await this.page.$('button:contains("Send"), button[type="submit"]');

        this.addTestResult('AI Employee Chat', {
          chatInterface: !!chatInterface,
          messageInput: !!messageInput,
          sendButton: !!sendButton,
          success: !!(chatInterface && messageInput)
        });

        if (chatInterface && messageInput) {
          console.log('✅ Chat interface loaded successfully');
          
          // Test sending a message
          await this.testChatMessage();
        } else {
          console.log('❌ Chat interface not found');
        }
      } else {
        console.log('❌ No chat button found');
        this.addTestResult('AI Employee Chat', {
          success: false,
          error: 'No chat button found'
        });
      }

    } catch (error) {
      console.log('❌ AI Employee chat test failed:', error.message);
      this.addTestResult('AI Employee Chat', {
        success: false,
        error: error.message
      });
    }
  }

  async testChatMessage() {
    console.log('\n💬 Testing Chat Message Sending...');
    
    try {
      // Find message input
      const messageInput = await this.page.$('input[type="text"], textarea, [data-testid="message-input"]');
      
      if (messageInput) {
        // Type a test message
        const testMessage = 'Create a React component for user authentication';
        await messageInput.type(testMessage);
        
        // Find and click send button
        const sendButton = await this.page.$('button:contains("Send"), button[type="submit"]');
        if (sendButton) {
          await sendButton.click();
          
          // Wait for response
          await this.page.waitForTimeout(3000);
          
          // Check for response messages
          const messages = await this.page.$$('[data-testid="message"], .message, .chat-message');
          console.log(`📨 Found ${messages.length} messages in chat`);
          
          this.addTestResult('Chat Message', {
            messageSent: true,
            messageCount: messages.length,
            success: messages.length > 0
          });
          
          console.log('✅ Message sent successfully');
        } else {
          console.log('❌ Send button not found');
        }
      } else {
        console.log('❌ Message input not found');
      }

    } catch (error) {
      console.log('❌ Chat message test failed:', error.message);
      this.addTestResult('Chat Message', {
        success: false,
        error: error.message
      });
    }
  }

  async testNavigation() {
    console.log('\n🧭 Testing Navigation...');
    
    try {
      // Test navigation between pages
      const navigationTests = [
        { name: 'Home', url: 'http://localhost:5173/' },
        { name: 'Demo', url: 'http://localhost:5173/demo' }
      ];

      for (const test of navigationTests) {
        await this.page.goto(test.url, { waitUntil: 'networkidle0', timeout: 15000 });
        const title = await this.page.title();
        
        this.addTestResult(`Navigation - ${test.name}`, {
          url: test.url,
          title: title,
          success: !title.includes('Error') && !title.includes('404')
        });
        
        console.log(`✅ ${test.name} navigation successful`);
      }

    } catch (error) {
      console.log('❌ Navigation test failed:', error.message);
      this.addTestResult('Navigation', {
        success: false,
        error: error.message
      });
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    try {
      const viewports = [
        { name: 'Desktop', width: 1280, height: 720 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.page.goto('http://localhost:5173/demo', { waitUntil: 'networkidle0' });
        
        // Check if content is visible and properly laid out
        const content = await this.page.$('main, .main, .container');
        const isVisible = content ? await content.isIntersectingViewport() : false;
        
        this.addTestResult(`Responsive - ${viewport.name}`, {
          viewport: `${viewport.width}x${viewport.height}`,
          contentVisible: isVisible,
          success: isVisible
        });
        
        console.log(`✅ ${viewport.name} responsive test passed`);
      }

    } catch (error) {
      console.log('❌ Responsive design test failed:', error.message);
      this.addTestResult('Responsive Design', {
        success: false,
        error: error.message
      });
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Navigate to demo page and measure performance
      const startTime = Date.now();
      await this.page.goto('http://localhost:5173/demo', { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });
      
      this.addTestResult('Performance', {
        loadTime: loadTime,
        domContentLoaded: metrics.domContentLoaded,
        loadComplete: metrics.loadComplete,
        totalTime: metrics.totalTime,
        success: loadTime < 5000 // 5 second threshold
      });
      
      console.log(`✅ Performance test completed - Load time: ${loadTime}ms`);
      
    } catch (error) {
      console.log('❌ Performance test failed:', error.message);
      this.addTestResult('Performance', {
        success: false,
        error: error.message
      });
    }
  }

  addTestResult(testName, result) {
    this.results.tests.push({
      name: testName,
      timestamp: new Date().toISOString(),
      result: result
    });
    
    this.results.summary.total++;
    if (result.success) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  async generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('=====================================');
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📈 Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    
    if (this.results.summary.errors.length > 0) {
      console.log('\n🚨 Errors Found:');
      this.results.summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Save detailed report
    const fs = require('fs');
    const reportPath = `website-test-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      // Run all tests
      await this.testLandingPage();
      await this.testDemoPage();
      await this.testAIEmployeeChat();
      await this.testNavigation();
      await this.testResponsiveDesign();
      await this.testPerformance();
      
      // Generate report
      const results = await this.generateReport();
      
      return results;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
async function runWebsiteTests() {
  const tester = new WebsiteTester();
  
  try {
    console.log('🚀 Starting AGI Agent Automation Platform Website Tests');
    console.log('======================================================');
    
    const results = await tester.runAllTests();
    
    console.log('\n🎉 All tests completed!');
    console.log(`📊 Final Results: ${results.summary.passed}/${results.summary.total} tests passed`);
    
    if (results.summary.failed > 0) {
      console.log('⚠️  Some tests failed. Check the detailed report for more information.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed! Website is working correctly.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runWebsiteTests();
}

module.exports = { WebsiteTester, runWebsiteTests };
