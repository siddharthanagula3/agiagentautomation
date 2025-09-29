// src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { PublicLayout } from './layouts/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardHomePage from './components/dashboard/DashboardHomePage';
import VisualWorkflowDesigner from './components/automation/VisualWorkflowDesigner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { AIEmployeeDemo } from './pages/demo/AIEmployeeDemo';
import { AuthDebugPage } from './pages/AuthDebugPage';
import { AuthDebugMonitor } from './components/AuthDebugMonitor';

// Page Components for advanced features
import WorkforcePage from './pages/workforce/WorkforcePage';
import AutomationPage from './pages/automation/AutomationPage';
import ChatPage from './pages/chat/ChatPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import WorkforceManagement from './components/employees/WorkforceManagement';
import AutonomousWorkflowsPage from './pages/autonomous/AutonomousWorkflowsPage';
import MarketplacePublicPage from './pages/MarketplacePublicPage';

function App() {
  console.log('App.tsx: Rendering main app component');
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="demo" element={<AIEmployeeDemo />} />
          </Route>

          {/* Marketplace - Protected Route (but not in dashboard layout) */}
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <MarketplacePublicPage />
              </ProtectedRoute>
            }
          />

          {/* Debug Route (accessible without auth) */}
          <Route path="/debug" element={<AuthDebugPage />} />

          {/* Auth Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Main Dashboard */}
            <Route index element={<DashboardHomePage />} />
            <Route path="home" element={<DashboardHomePage />} />
            
            {/* Workforce Management */}
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="workforce/management" element={<WorkforceManagement />} />
            
            {/* Chat & Communication */}
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:tabId?" element={<ChatPage />} />
            
            {/* Automation & Workflows */}
            <Route path="automation" element={<AutomationPage />} />
            <Route path="automation/workflows" element={<AutonomousWorkflowsPage />} />
            <Route path="automation/designer" element={<AutomationDesignerPage />} />
            <Route path="automation/designer/:workflowId?" element={<AutomationDesignerPage />} />
            
            {/* Integrations */}
            <Route path="integrations" element={<IntegrationsPage />} />
            
            {/* Analytics & Reports */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/:view?" element={<AnalyticsPage />} />
            
            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/:section?" element={<SettingsPage />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="old-dashboard" element={<Dashboard />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Auth Debug Monitor (dev only) */}
        <AuthDebugMonitor />

        {/* Global Components */}
        <Toaster 
          position="bottom-right"
          theme="dark"
          className="toaster"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #374151',
            },
          }}
        />
      </div>
      
      {/* React Query Devtools (only in development) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </TooltipProvider>
  );
}

// Page wrapper components
const AutomationDesignerPage = () => {
  return (
    <div className="h-full">
      <VisualWorkflowDesigner 
        className="h-[calc(100vh-12rem)]"
        allowTabCreation={true}
        maxTabs={10}
        enableToolExecution={true}
        onSave={(workflow) => {
          console.log('Saving workflow:', workflow);
          // Handle workflow save
        }}
        onExecute={(workflowId) => {
          console.log('Executing workflow:', workflowId);
          // Handle workflow execution
        }}
      />
    </div>
  );
};

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default App;
