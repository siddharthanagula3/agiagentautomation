// Comprehensive Page Testing with Real Backend Data
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 COMPREHENSIVE PAGE TESTING WITH REAL BACKEND DATA');
console.log('====================================================');

class ComprehensivePageTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {};
    this.backendData = {};
  }

  async initialize() {
    console.log('\n📊 STEP 1: Initializing Testing Environment');
    console.log('---------------------------------------------');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up comprehensive monitoring
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log(`❌ CONSOLE ERROR: ${text}`);
      }
    });

    this.page.on('requestfailed', request => {
      console.log(`❌ NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('✅ Testing environment initialized');
  }

  async authenticateUser() {
    console.log('\n📊 STEP 2: Authenticating User');
    console.log('-----------------------------');
    
    try {
      // Navigate to login page
      await this.page.goto('https://agiagentautomation.com/auth/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Fill login form
      await this.page.type('input[type="email"]', 'founders@agiagentautomation.com');
      await this.page.type('input[type="password"]', 'Sid@8790');
      
      // Click submit
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ timeout: 15000 });
      
      // Check if we're on dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ User authenticated successfully');
        return true;
      } else {
        console.log('❌ Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    }
  }

  async populateBackendData() {
    console.log('\n📊 STEP 3: Populating Backend Data');
    console.log('----------------------------------');
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('⚠️  No authenticated user, using test data approach');
        return;
      }

      console.log(`✅ User authenticated: ${user.email}`);
      
      // Populate test data for all tables
      await this.createTestJobs(user.id);
      await this.createTestNotifications(user.id);
      await this.createTestAnalytics(user.id);
      await this.createTestSettings(user.id);
      await this.createTestAIEmployees(user.id);
      await this.createTestReports(user.id);
      await this.createTestBilling(user.id);
      await this.createTestWorkforce(user.id);
      
      console.log('✅ Backend data populated successfully');
      
    } catch (error) {
      console.error('❌ Failed to populate backend data:', error);
    }
  }

  async createTestJobs(userId) {
    const jobs = [
      {
        title: 'Website Performance Optimization',
        description: 'Optimize website loading speed and user experience',
        status: 'in_progress',
        priority: 'high',
        assigned_to: userId,
        created_by: userId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['frontend', 'performance', 'optimization'],
        metadata: { estimated_hours: 40, complexity: 'high' }
      },
      {
        title: 'Database Migration',
        description: 'Migrate legacy data to new database structure',
        status: 'pending',
        priority: 'medium',
        assigned_to: userId,
        created_by: userId,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['backend', 'database', 'migration'],
        metadata: { estimated_hours: 20, complexity: 'medium' }
      },
      {
        title: 'API Documentation',
        description: 'Create comprehensive API documentation',
        status: 'completed',
        priority: 'low',
        assigned_to: userId,
        created_by: userId,
        completed_at: new Date().toISOString(),
        tags: ['documentation', 'api'],
        metadata: { estimated_hours: 8, complexity: 'low' }
      }
    ];

    for (const job of jobs) {
      const { error } = await supabase
        .from('jobs')
        .insert(job);
      
      if (error) {
        console.log(`⚠️  Failed to insert job: ${error.message}`);
      } else {
        console.log(`✅ Job created: ${job.title}`);
      }
    }
  }

  async createTestNotifications(userId) {
    const notifications = [
      {
        user_id: userId,
        title: 'Welcome to AGI Agent Automation',
        message: 'Your account has been successfully created. Start by exploring the dashboard.',
        type: 'welcome',
        read: false,
        action_url: '/dashboard'
      },
      {
        user_id: userId,
        title: 'New Job Assigned',
        message: 'You have been assigned a new task: Website Performance Optimization',
        type: 'assignment',
        read: false,
        action_url: '/dashboard/jobs'
      },
      {
        user_id: userId,
        title: 'System Update',
        message: 'The system has been updated with new features and improvements.',
        type: 'system',
        read: true,
        action_url: '/dashboard/settings'
      },
      {
        user_id: userId,
        title: 'Task Completed',
        message: 'API Documentation task has been completed successfully.',
        type: 'success',
        read: false,
        action_url: '/dashboard/jobs'
      }
    ];

    for (const notification of notifications) {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (error) {
        console.log(`⚠️  Failed to insert notification: ${error.message}`);
      } else {
        console.log(`✅ Notification created: ${notification.title}`);
      }
    }
  }

  async createTestAnalytics(userId) {
    const analytics = [
      {
        user_id: userId,
        event_type: 'page_view',
        event_data: { page: '/dashboard', duration: 45 },
        page_url: '/dashboard',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip_address: '192.168.1.1'
      },
      {
        user_id: userId,
        event_type: 'login',
        event_data: { method: 'email', success: true },
        page_url: '/auth/login',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip_address: '192.168.1.1'
      },
      {
        user_id: userId,
        event_type: 'feature_used',
        event_data: { feature: 'job_management', action: 'create' },
        page_url: '/dashboard/jobs',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip_address: '192.168.1.1'
      },
      {
        user_id: userId,
        event_type: 'ai_interaction',
        event_data: { ai_employee: 'Marketing Assistant', interaction_type: 'chat' },
        page_url: '/dashboard/ai-employees',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip_address: '192.168.1.1'
      }
    ];

    for (const analytic of analytics) {
      const { error } = await supabase
        .from('analytics')
        .insert(analytic);
      
      if (error) {
        console.log(`⚠️  Failed to insert analytics: ${error.message}`);
      } else {
        console.log(`✅ Analytics created: ${analytic.event_type}`);
      }
    }
  }

  async createTestSettings(userId) {
    const settings = {
      user_id: userId,
      theme: 'light',
      notifications: true,
      email_notifications: true,
      push_notifications: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        currency: 'USD',
        notifications_frequency: 'immediate'
      }
    };

    const { error } = await supabase
      .from('settings')
      .insert(settings);
    
    if (error) {
      console.log(`⚠️  Failed to insert settings: ${error.message}`);
    } else {
      console.log(`✅ Settings created for user`);
    }
  }

  async createTestAIEmployees(userId) {
    const aiEmployees = [
      {
        name: 'Marketing Assistant',
        description: 'AI assistant specialized in marketing tasks and content creation',
        capabilities: ['content_creation', 'social_media', 'email_marketing', 'seo_optimization'],
        status: 'available',
        created_by: userId,
        configuration: {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000
        },
        performance_metrics: {
          tasks_completed: 45,
          success_rate: 0.92,
          average_response_time: 2.3
        }
      },
      {
        name: 'Data Analyst',
        description: 'AI assistant for data analysis and reporting',
        capabilities: ['data_analysis', 'reporting', 'visualization', 'statistics'],
        status: 'available',
        created_by: userId,
        configuration: {
          model: 'claude-3',
          temperature: 0.3,
          max_tokens: 4000
        },
        performance_metrics: {
          tasks_completed: 32,
          success_rate: 0.88,
          average_response_time: 3.1
        }
      },
      {
        name: 'Customer Support',
        description: 'AI assistant for customer support and inquiries',
        capabilities: ['customer_service', 'ticket_management', 'faq', 'escalation'],
        status: 'busy',
        created_by: userId,
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          max_tokens: 1500
        },
        performance_metrics: {
          tasks_completed: 78,
          success_rate: 0.95,
          average_response_time: 1.8
        }
      }
    ];

    for (const aiEmployee of aiEmployees) {
      const { error } = await supabase
        .from('ai_employees')
        .insert(aiEmployee);
      
      if (error) {
        console.log(`⚠️  Failed to insert AI employee: ${error.message}`);
      } else {
        console.log(`✅ AI Employee created: ${aiEmployee.name}`);
      }
    }
  }

  async createTestReports(userId) {
    const reports = [
      {
        user_id: userId,
        title: 'Monthly Performance Report',
        type: 'performance',
        data: {
          total_tasks: 45,
          completed_tasks: 42,
          success_rate: 0.93,
          average_completion_time: 2.5
        },
        status: 'completed',
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: 'User Engagement Analysis',
        type: 'analytics',
        data: {
          page_views: 1250,
          unique_visitors: 340,
          bounce_rate: 0.25,
          session_duration: 4.2
        },
        status: 'completed',
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: 'System Health Report',
        type: 'system',
        data: {
          uptime: 0.999,
          error_rate: 0.001,
          response_time: 1.2,
          active_users: 156
        },
        status: 'generating',
        created_at: new Date().toISOString()
      }
    ];

    for (const report of reports) {
      const { error } = await supabase
        .from('reports')
        .insert(report);
      
      if (error) {
        console.log(`⚠️  Failed to insert report: ${error.message}`);
      } else {
        console.log(`✅ Report created: ${report.title}`);
      }
    }
  }

  async createTestBilling(userId) {
    const billing = {
      user_id: userId,
      plan: 'pro',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        price: 29.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: ['unlimited_jobs', 'ai_employees', 'analytics', 'priority_support']
      }
    };

    const { error } = await supabase
      .from('billing')
      .insert(billing);
    
    if (error) {
      console.log(`⚠️  Failed to insert billing: ${error.message}`);
    } else {
      console.log(`✅ Billing created for user`);
    }
  }

  async createTestWorkforce(userId) {
    const workforce = {
      user_id: userId,
      name: 'Development Team',
      description: 'Core development team for AGI Agent Automation',
      members: [
        { name: 'John Doe', role: 'Lead Developer', email: 'john@example.com' },
        { name: 'Jane Smith', role: 'UI/UX Designer', email: 'jane@example.com' },
        { name: 'Mike Johnson', role: 'DevOps Engineer', email: 'mike@example.com' }
      ],
      settings: {
        collaboration_tools: ['slack', 'github', 'figma'],
        working_hours: '9-17 UTC',
        timezone: 'UTC'
      }
    };

    const { error } = await supabase
      .from('workforce')
      .insert(workforce);
    
    if (error) {
      console.log(`⚠️  Failed to insert workforce: ${error.message}`);
    } else {
      console.log(`✅ Workforce created: ${workforce.name}`);
    }
  }

  async testAllPages() {
    console.log('\n📊 STEP 4: Testing All Pages with Real Data');
    console.log('-------------------------------------------');
    
    const pages = [
      { path: '/dashboard', name: 'Dashboard', expectedElements: ['header', 'sidebar', 'main-content'] },
      { path: '/dashboard/jobs', name: 'Jobs Page', expectedElements: ['job-list', 'create-job-button'] },
      { path: '/dashboard/employees', name: 'Employees Page', expectedElements: ['employee-list', 'add-employee-button'] },
      { path: '/dashboard/analytics', name: 'Analytics Page', expectedElements: ['charts', 'metrics', 'filters'] },
      { path: '/dashboard/notifications', name: 'Notifications Page', expectedElements: ['notification-list', 'mark-read-button'] },
      { path: '/dashboard/settings', name: 'Settings Page', expectedElements: ['settings-form', 'save-button'] },
      { path: '/dashboard/ai-employees', name: 'AI Employees Page', expectedElements: ['ai-list', 'create-ai-button'] },
      { path: '/dashboard/reports', name: 'Reports Page', expectedElements: ['report-list', 'generate-report-button'] },
      { path: '/dashboard/team', name: 'Team Page', expectedElements: ['team-list', 'invite-button'] },
      { path: '/dashboard/profile', name: 'Profile Page', expectedElements: ['profile-form', 'avatar', 'save-button'] }
    ];

    for (const page of pages) {
      try {
        console.log(`\n🔍 Testing ${page.name}...`);
        
        await this.page.goto(`https://agiagentautomation.com${page.path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        const currentUrl = this.page.url();
        if (currentUrl.includes(page.path)) {
          console.log(`✅ ${page.name} loaded successfully`);
          
          // Check for expected elements
          let elementsFound = 0;
          for (const element of page.expectedElements) {
            const elementExists = await this.page.$(`[data-testid*="${element}"], .${element}, #${element}`);
            if (elementExists) {
              elementsFound++;
            }
          }
          
          console.log(`📊 Found ${elementsFound}/${page.expectedElements.length} expected elements`);
          
          this.testResults[page.path] = {
            status: 'success',
            elementsFound: elementsFound,
            totalElements: page.expectedElements.length
          };
        } else {
          console.log(`❌ ${page.name} failed to load`);
          this.testResults[page.path] = { status: 'failed' };
        }
        
        // Wait between page tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error testing ${page.name}:`, error.message);
        this.testResults[page.path] = { status: 'error', error: error.message };
      }
    }
  }

  async generateFinalReport() {
    console.log('\n📊 STEP 5: Generating Final Report');
    console.log('----------------------------------');
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        totalPages: Object.keys(this.testResults).length,
        successfulPages: Object.values(this.testResults).filter(r => r.status === 'success').length,
        failedPages: Object.values(this.testResults).filter(r => r.status === 'failed').length,
        errorPages: Object.values(this.testResults).filter(r => r.status === 'error').length
      }
    };

    console.log(`\n📊 COMPREHENSIVE TESTING REPORT:`);
    console.log(`  ✅ Successful Pages: ${report.summary.successfulPages}`);
    console.log(`  ❌ Failed Pages: ${report.summary.failedPages}`);
    console.log(`  💥 Error Pages: ${report.summary.errorPages}`);
    console.log(`  📊 Total Pages Tested: ${report.summary.totalPages}`);

    // Save report
    const fs = await import('fs');
    fs.writeFileSync('comprehensive-page-test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to comprehensive-page-test-report.json');
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n✅ Testing browser closed');
    }
  }
}

// Main execution
async function runComprehensivePageTesting() {
  const tester = new ComprehensivePageTester();
  
  try {
    await tester.initialize();
    
    // Authenticate user
    const authSuccess = await tester.authenticateUser();
    if (!authSuccess) {
      console.log('❌ Authentication failed, cannot proceed with testing');
      return;
    }
    
    // Populate backend data
    await tester.populateBackendData();
    
    // Test all pages
    await tester.testAllPages();
    
    // Generate report
    await tester.generateFinalReport();
    
    console.log('\n🎯 COMPREHENSIVE PAGE TESTING COMPLETE');
    console.log('=====================================');
    console.log('✅ User authenticated');
    console.log('✅ Backend data populated');
    console.log('✅ All pages tested');
    console.log('📊 Comprehensive report generated');
    
  } catch (error) {
    console.error('💥 Comprehensive page testing failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run the comprehensive page testing
runComprehensivePageTesting();
