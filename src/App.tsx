// src/App.tsx - CLEANED VERSION (Debug components removed)

import { Routes, Route } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { PublicLayout } from './layouts/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardHomePage from './components/dashboard/DashboardHomePage';
import VisualWorkflowDesigner from './components/automation/VisualWorkflowDesigner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

// Page Components
import WorkforcePage from './pages/workforce/WorkforcePage';
import AutomationPage from './pages/automation/AutomationPage';
import ChatPage from './pages/chat/ChatPage';
import TabbedLLMChatPage from './pages/chat/TabbedLLMChatPage';
import ChatAgentPageChatKit from './pages/chat/ChatAgentPageChatKit';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AIConfigurationPage from './pages/settings/AIConfigurationPage';
import MarketplacePublicPage from './pages/MarketplacePublicPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import BillingPage from './pages/dashboard/BillingPage';
import APIKeysPage from './pages/dashboard/APIKeysPage';
import HelpSupportPage from './pages/dashboard/HelpSupportPage';
import MCPToolsPage from './pages/MCPToolsPage';

// New Public Pages
import BlogPage from './pages/BlogPage';
import ResourcesPage from './pages/ResourcesPage';
import HelpPage from './pages/HelpPage';
import PricingPage from './pages/PricingPage';
import ContactSalesPage from './pages/ContactSalesPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import SecurityPage from './pages/SecurityPage';
import DocumentationPage from './pages/DocumentationPage';
import APIReferencePage from './pages/APIReferencePage';
import AIEmployees from './pages/ai-employees/AIEmployees';

// Legal Pages
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

// Use Cases Pages
import StartupsPage from './pages/use-cases/StartupsPage';
import ITServiceProvidersPage from './pages/use-cases/ITServiceProvidersPage';
import SalesTeamsPage from './pages/use-cases/SalesTeamsPage';
import ConsultingBusinessesPage from './pages/use-cases/ConsultingBusinessesPage';

// Features Pages
import AIChatPage from './pages/features/AIChatPage';
import AIWorkflowsPage from './pages/features/AIWorkflowsPage';
import IntegrationsFeaturePage from './pages/features/IntegrationsPage';
import AIDashboardsPage from './pages/features/AIDashboardsPage';
import AIProjectManagerPage from './pages/features/AIProjectManagerPage';

// Comparison Pages
import VsChatGPTPage from './pages/comparisons/VsChatGPTPage';
import VsClaudePage from './pages/comparisons/VsClaudePage';

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />

              {/* Marketing Pages */}
              <Route path="blog" element={<BlogPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="contact-sales" element={<ContactSalesPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="careers" element={<CareersPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="documentation" element={<DocumentationPage />} />
              <Route path="api-reference" element={<APIReferencePage />} />
              <Route path="marketplace" element={<MarketplacePublicPage />} />
              <Route path="ai-employees" element={<AIEmployees />} />

              {/* Legal Pages */}
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms-of-service" element={<TermsOfServicePage />} />
              <Route path="cookie-policy" element={<CookiePolicyPage />} />

              {/* Use Cases */}
              <Route path="use-cases/startups" element={<StartupsPage />} />
              <Route path="use-cases/it-service-providers" element={<ITServiceProvidersPage />} />
              <Route path="use-cases/sales-teams" element={<SalesTeamsPage />} />
              <Route path="use-cases/consulting-businesses" element={<ConsultingBusinessesPage />} />

              {/* Features */}
              <Route path="features/ai-chat" element={<AIChatPage />} />
              <Route path="features/ai-workflows" element={<AIWorkflowsPage />} />
              <Route path="features/integrations" element={<IntegrationsFeaturePage />} />
              <Route path="features/ai-dashboards" element={<AIDashboardsPage />} />
              <Route path="features/ai-project-manager" element={<AIProjectManagerPage />} />

              {/* Comparison Pages */}
              <Route path="vs-chatgpt" element={<VsChatGPTPage />} />
              <Route path="vs-claude" element={<VsClaudePage />} />
              <Route path="chatgpt-alternative" element={<VsChatGPTPage />} />
              <Route path="claude-alternative" element={<VsClaudePage />} />
            </Route>

            {/* Auth Routes - Both /auth/* and root level */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Root level auth routes for convenience */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes - ALL AT ROOT LEVEL */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard Home */}
              <Route path="dashboard" element={<DashboardHomePage />} />
              
              {/* Main Features */}
              <Route path="workforce" element={<WorkforcePage />} />
              
              {/* Chat Routes */}
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:sessionId" element={<ChatPage />} />
              
              {/* Chat Agent (ChatKit-based AI Employee Chat) */}
              <Route path="chat-agent" element={<ChatAgentPageChatKit />} />
              <Route path="chat-agent/:sessionId" element={<ChatAgentPageChatKit />} />
              
              {/* Multi-LLM Chat */}
              <Route path="chat-multi" element={<TabbedLLMChatPage />} />
              <Route path="chat-multi/:sessionId" element={<TabbedLLMChatPage />} />
              
              <Route path="automation" element={<AutomationPage />} />
              <Route path="automation/designer" element={<AutomationDesignerPage />} />
              <Route path="automation/designer/:workflowId" element={<AutomationDesignerPage />} />
              
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="mcp-tools" element={<MCPToolsPage />} />

              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="analytics/:view" element={<AnalyticsPage />} />
              
              {/* Account & System at Root Level */}
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/:section" element={<SettingsPage />} />
              <Route path="settings/ai-configuration" element={<AIConfigurationPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="api-keys" element={<APIKeysPage />} />
              <Route path="support" element={<HelpSupportPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

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
        
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </TooltipProvider>
    </ThemeProvider>
  );
}

const AutomationDesignerPage = () => {
  return (
    <div className="h-full">
      <VisualWorkflowDesigner 
        className="h-[calc(100vh-12rem)]"
        allowTabCreation={true}
        maxTabs={10}
        enableToolExecution={true}
        onSave={(workflow) => {
          // Workflow saved
        }}
        onExecute={(workflowId) => {
          // Workflow executed
        }}
      />
    </div>
  );
};

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default App;
