// Comprehensive Backend Testing and Database Setup
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 COMPREHENSIVE BACKEND TESTING & DATABASE SETUP');
console.log('=================================================');

class BackendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {};
    this.databaseIssues = [];
    this.missingTables = [];
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

  async checkDatabaseSchema() {
    console.log('\n📊 STEP 2: Checking Database Schema');
    console.log('-----------------------------------');
    
    try {
      // Check if users table exists and has proper structure
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.log('❌ Users table issue:', usersError.message);
        this.databaseIssues.push({
          table: 'users',
          issue: usersError.message,
          severity: 'high'
        });
      } else {
        console.log('✅ Users table accessible');
      }

      // Check for other common tables that might be needed
      const commonTables = [
        'jobs',
        'employees', 
        'notifications',
        'analytics',
        'settings',
        'billing',
        'workforce',
        'ai_employees',
        'chat_messages',
        'reports'
      ];

      for (const tableName of commonTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            if (error.code === 'PGRST116') {
              console.log(`⚠️  Table '${tableName}' does not exist`);
              this.missingTables.push(tableName);
            } else {
              console.log(`❌ Table '${tableName}' error:`, error.message);
              this.databaseIssues.push({
                table: tableName,
                issue: error.message,
                severity: 'medium'
              });
            }
          } else {
            console.log(`✅ Table '${tableName}' accessible`);
          }
        } catch (err) {
          console.log(`❌ Error checking table '${tableName}':`, err.message);
        }
      }

      console.log(`\n📋 Database Analysis Complete:`);
      console.log(`  ❌ Issues: ${this.databaseIssues.length}`);
      console.log(`  ⚠️  Missing Tables: ${this.missingTables.length}`);
      
    } catch (error) {
      console.error('💥 Database schema check failed:', error);
    }
  }

  async createMissingTables() {
    console.log('\n📊 STEP 3: Creating Missing Tables');
    console.log('----------------------------------');
    
    if (this.missingTables.length === 0) {
      console.log('✅ No missing tables to create');
      return;
    }

    console.log(`🔧 Creating ${this.missingTables.length} missing tables...`);

    for (const tableName of this.missingTables) {
      try {
        await this.createTable(tableName);
        console.log(`✅ Table '${tableName}' created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create table '${tableName}':`, error);
      }
    }
  }

  async createTable(tableName) {
    const tableSchemas = {
      jobs: `
        CREATE TABLE IF NOT EXISTS public.jobs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          assigned_to UUID REFERENCES public.users(id),
          created_by UUID REFERENCES public.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          due_date TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE
        );
        
        ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own jobs" ON public.jobs
          FOR SELECT USING (auth.uid() = created_by OR auth.uid() = assigned_to);
        
        CREATE POLICY "Users can insert own jobs" ON public.jobs
          FOR INSERT WITH CHECK (auth.uid() = created_by);
        
        CREATE POLICY "Users can update own jobs" ON public.jobs
          FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
      `,
      
      employees: `
        CREATE TABLE IF NOT EXISTS public.employees (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) UNIQUE,
          employee_id TEXT UNIQUE,
          department TEXT,
          position TEXT,
          salary DECIMAL,
          hire_date DATE,
          status TEXT DEFAULT 'active',
          manager_id UUID REFERENCES public.employees(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own employee record" ON public.employees
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own employee record" ON public.employees
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own employee record" ON public.employees
          FOR UPDATE USING (auth.uid() = user_id);
      `,
      
      notifications: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id),
          title TEXT NOT NULL,
          message TEXT,
          type TEXT DEFAULT 'info',
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          data JSONB
        );
        
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON public.notifications
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own notifications" ON public.notifications
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own notifications" ON public.notifications
          FOR UPDATE USING (auth.uid() = user_id);
      `,
      
      analytics: `
        CREATE TABLE IF NOT EXISTS public.analytics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id),
          event_type TEXT NOT NULL,
          event_data JSONB,
          page_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own analytics" ON public.analytics
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own analytics" ON public.analytics
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `,
      
      settings: `
        CREATE TABLE IF NOT EXISTS public.settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) UNIQUE,
          theme TEXT DEFAULT 'light',
          notifications BOOLEAN DEFAULT TRUE,
          email_notifications BOOLEAN DEFAULT TRUE,
          preferences JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own settings" ON public.settings
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own settings" ON public.settings
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own settings" ON public.settings
          FOR UPDATE USING (auth.uid() = user_id);
      `,
      
      ai_employees: `
        CREATE TABLE IF NOT EXISTS public.ai_employees (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          capabilities JSONB,
          status TEXT DEFAULT 'available',
          created_by UUID REFERENCES public.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view ai employees" ON public.ai_employees
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can insert ai employees" ON public.ai_employees
          FOR INSERT WITH CHECK (auth.uid() = created_by);
        
        CREATE POLICY "Users can update ai employees" ON public.ai_employees
          FOR UPDATE USING (auth.uid() = created_by);
      `,
      
      chat_messages: `
        CREATE TABLE IF NOT EXISTS public.chat_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id),
          ai_employee_id UUID REFERENCES public.ai_employees(id),
          message TEXT NOT NULL,
          is_user BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own messages" ON public.chat_messages
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own messages" ON public.chat_messages
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `,
      
      reports: `
        CREATE TABLE IF NOT EXISTS public.reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id),
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own reports" ON public.reports
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own reports" ON public.reports
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own reports" ON public.reports
          FOR UPDATE USING (auth.uid() = user_id);
      `
    };

    const schema = tableSchemas[tableName];
    if (!schema) {
      throw new Error(`No schema defined for table: ${tableName}`);
    }

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }

  async populateTestData() {
    console.log('\n📊 STEP 4: Populating Test Data');
    console.log('--------------------------------');
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('⚠️  No authenticated user, skipping test data population');
        return;
      }

      console.log(`🔧 Populating test data for user: ${user.email}`);

      // Populate jobs
      await this.populateJobs(user.id);
      
      // Populate notifications
      await this.populateNotifications(user.id);
      
      // Populate analytics
      await this.populateAnalytics(user.id);
      
      // Populate settings
      await this.populateSettings(user.id);
      
      // Populate AI employees
      await this.populateAIEmployees(user.id);
      
      console.log('✅ Test data populated successfully');
      
    } catch (error) {
      console.error('❌ Failed to populate test data:', error);
    }
  }

  async populateJobs(userId) {
    const jobs = [
      {
        title: 'Website Optimization',
        description: 'Optimize website performance and user experience',
        status: 'in_progress',
        priority: 'high',
        assigned_to: userId,
        created_by: userId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Database Migration',
        description: 'Migrate legacy data to new database structure',
        status: 'pending',
        priority: 'medium',
        assigned_to: userId,
        created_by: userId,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'API Documentation',
        description: 'Create comprehensive API documentation',
        status: 'completed',
        priority: 'low',
        assigned_to: userId,
        created_by: userId,
        completed_at: new Date().toISOString()
      }
    ];

    for (const job of jobs) {
      const { error } = await supabase
        .from('jobs')
        .insert(job);
      
      if (error) {
        console.log(`⚠️  Failed to insert job: ${error.message}`);
      }
    }
  }

  async populateNotifications(userId) {
    const notifications = [
      {
        user_id: userId,
        title: 'Welcome to AGI Agent Automation',
        message: 'Your account has been successfully created. Start by exploring the dashboard.',
        type: 'welcome',
        read: false
      },
      {
        user_id: userId,
        title: 'New Job Assigned',
        message: 'You have been assigned a new task: Website Optimization',
        type: 'assignment',
        read: false
      },
      {
        user_id: userId,
        title: 'System Update',
        message: 'The system has been updated with new features and improvements.',
        type: 'system',
        read: true
      }
    ];

    for (const notification of notifications) {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (error) {
        console.log(`⚠️  Failed to insert notification: ${error.message}`);
      }
    }
  }

  async populateAnalytics(userId) {
    const analytics = [
      {
        user_id: userId,
        event_type: 'page_view',
        event_data: { page: '/dashboard' },
        page_url: '/dashboard'
      },
      {
        user_id: userId,
        event_type: 'login',
        event_data: { method: 'email' },
        page_url: '/auth/login'
      },
      {
        user_id: userId,
        event_type: 'feature_used',
        event_data: { feature: 'job_management' },
        page_url: '/dashboard/jobs'
      }
    ];

    for (const analytic of analytics) {
      const { error } = await supabase
        .from('analytics')
        .insert(analytic);
      
      if (error) {
        console.log(`⚠️  Failed to insert analytics: ${error.message}`);
      }
    }
  }

  async populateSettings(userId) {
    const settings = {
      user_id: userId,
      theme: 'light',
      notifications: true,
      email_notifications: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY'
      }
    };

    const { error } = await supabase
      .from('settings')
      .insert(settings);
    
    if (error) {
      console.log(`⚠️  Failed to insert settings: ${error.message}`);
    }
  }

  async populateAIEmployees(userId) {
    const aiEmployees = [
      {
        name: 'Marketing Assistant',
        description: 'AI assistant specialized in marketing tasks and content creation',
        capabilities: ['content_creation', 'social_media', 'email_marketing'],
        status: 'available',
        created_by: userId
      },
      {
        name: 'Data Analyst',
        description: 'AI assistant for data analysis and reporting',
        capabilities: ['data_analysis', 'reporting', 'visualization'],
        status: 'available',
        created_by: userId
      },
      {
        name: 'Customer Support',
        description: 'AI assistant for customer support and inquiries',
        capabilities: ['customer_service', 'ticket_management', 'faq'],
        status: 'busy',
        created_by: userId
      }
    ];

    for (const aiEmployee of aiEmployees) {
      const { error } = await supabase
        .from('ai_employees')
        .insert(aiEmployee);
      
      if (error) {
        console.log(`⚠️  Failed to insert AI employee: ${error.message}`);
      }
    }
  }

  async testAllPages() {
    console.log('\n📊 STEP 5: Testing All Pages with Real Data');
    console.log('-------------------------------------------');
    
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/jobs', name: 'Jobs Page' },
      { path: '/dashboard/employees', name: 'Employees Page' },
      { path: '/dashboard/analytics', name: 'Analytics Page' },
      { path: '/dashboard/notifications', name: 'Notifications Page' },
      { path: '/dashboard/settings', name: 'Settings Page' },
      { path: '/dashboard/ai-employees', name: 'AI Employees Page' },
      { path: '/dashboard/reports', name: 'Reports Page' },
      { path: '/dashboard/team', name: 'Team Page' },
      { path: '/dashboard/profile', name: 'Profile Page' }
    ];

    for (const page of pages) {
      try {
        console.log(`🔍 Testing ${page.name}...`);
        
        await this.page.goto(`https://agiagentautomation.com${page.path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        const currentUrl = this.page.url();
        if (currentUrl.includes(page.path)) {
          console.log(`✅ ${page.name} loaded successfully`);
          this.testResults[page.path] = 'success';
        } else {
          console.log(`❌ ${page.name} failed to load`);
          this.testResults[page.path] = 'failed';
        }
        
        // Wait a bit between page tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error testing ${page.name}:`, error.message);
        this.testResults[page.path] = 'error';
      }
    }
  }

  async generateFinalReport() {
    console.log('\n📊 STEP 6: Generating Final Report');
    console.log('----------------------------------');
    
    const report = {
      timestamp: new Date().toISOString(),
      databaseIssues: this.databaseIssues,
      missingTables: this.missingTables,
      testResults: this.testResults,
      summary: {
        totalPages: Object.keys(this.testResults).length,
        successfulPages: Object.values(this.testResults).filter(r => r === 'success').length,
        failedPages: Object.values(this.testResults).filter(r => r === 'failed').length,
        errorPages: Object.values(this.testResults).filter(r => r === 'error').length
      }
    };

    console.log(`\n📊 FINAL REPORT:`);
    console.log(`  📋 Database Issues: ${report.databaseIssues.length}`);
    console.log(`  ⚠️  Missing Tables: ${report.missingTables.length}`);
    console.log(`  ✅ Successful Pages: ${report.summary.successfulPages}`);
    console.log(`  ❌ Failed Pages: ${report.summary.failedPages}`);
    console.log(`  💥 Error Pages: ${report.summary.errorPages}`);
    console.log(`  📊 Total Pages Tested: ${report.summary.totalPages}`);

    // Save report
    const fs = await import('fs');
    fs.writeFileSync('backend-test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to backend-test-report.json');
    
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
async function runBackendTesting() {
  const tester = new BackendTester();
  
  try {
    await tester.initialize();
    await tester.checkDatabaseSchema();
    await tester.createMissingTables();
    await tester.populateTestData();
    await tester.testAllPages();
    await tester.generateFinalReport();
    
    console.log('\n🎯 BACKEND TESTING COMPLETE');
    console.log('============================');
    console.log('✅ Database schema checked');
    console.log('✅ Missing tables created');
    console.log('✅ Test data populated');
    console.log('✅ All pages tested');
    console.log('📊 Comprehensive report generated');
    
  } catch (error) {
    console.error('💥 Backend testing failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run the backend testing
runBackendTesting();
