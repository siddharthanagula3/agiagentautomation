// src/App.tsx - CLEANED VERSION (Debug components removed)
import { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import ScrollToTop from '@/components/ScrollToTop';
import { lazyWithRetry } from '@/components/LazyWrapper';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { monitoringService } from '@/services/monitoring-service';
import { usePagePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { accessibilityService } from '@/services/accessibility-service';
import { seoService } from '@/services/seo-service';
import { analyticsService } from '@/services/analytics-service';
import { performanceService } from '@/services/performance-service';
import { backupService } from '@/services/backup-service';
import { scalingService } from '@/services/scaling-service';
import { privacyService } from '@/services/privacy-service';
import SkipLink from '@/components/accessibility/SkipLink';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

// Lazy load all page components for better performance
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const LoginPage = lazyWithRetry(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyWithRetry(
  () => import('./pages/auth/ForgotPasswordPage')
);
const ResetPasswordPage = lazyWithRetry(
  () => import('./pages/auth/ResetPasswordPage')
);
const DashboardHomePage = lazyWithRetry(
  () => import('./pages/DashboardHomePage')
);

// Lazy load all other page components
const WorkforcePage = lazyWithRetry(
  () => import('./pages/workforce/WorkforcePage')
);
const ChatPage = lazyWithRetry(() => import('./pages/chat/ChatPage'));
const TabbedLLMChatPage = lazyWithRetry(
  () => import('./pages/chat/TabbedLLMChatPage')
);
const ChatAgentPageChatKit = lazyWithRetry(
  () => import('./pages/chat/ChatAgentPageChatKit')
);
const VibeCodingPage = lazyWithRetry(
  () => import('./pages/chat/VibeCodingPage')
);
const SettingsPage = lazyWithRetry(
  () => import('./pages/settings/SettingsPage')
);
const AIConfigurationPage = lazyWithRetry(
  () => import('./pages/settings/AIConfigurationPage')
);
const MarketplacePublicPage = lazyWithRetry(
  () => import('./pages/MarketplacePublicPage')
);
const BillingPage = lazyWithRetry(() => import('./pages/BillingPage'));
const HelpSupportPage = lazyWithRetry(() => import('./pages/HelpSupportPage'));
const SetupGuidePage = lazyWithRetry(() => import('./pages/SetupGuidePage'));

// Lazy load public pages
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'));
const ResourcesPage = lazyWithRetry(() => import('./pages/ResourcesPage'));
const HelpPage = lazyWithRetry(() => import('./pages/HelpPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const ContactSalesPage = lazyWithRetry(
  () => import('./pages/ContactSalesPage')
);
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const CareersPage = lazyWithRetry(() => import('./pages/CareersPage'));
const SecurityPage = lazyWithRetry(() => import('./pages/SecurityPage'));
const DocumentationPage = lazyWithRetry(
  () => import('./pages/DocumentationPage')
);
const APIReferencePage = lazyWithRetry(
  () => import('./pages/APIReferencePage')
);

// Lazy load legal pages
const PrivacyPolicyPage = lazyWithRetry(
  () => import('./pages/legal/PrivacyPolicyPage')
);
const TermsOfServicePage = lazyWithRetry(
  () => import('./pages/legal/TermsOfServicePage')
);
const CookiePolicyPage = lazyWithRetry(
  () => import('./pages/legal/CookiePolicyPage')
);

// Lazy load use cases pages
const StartupsPage = lazyWithRetry(
  () => import('./pages/use-cases/StartupsPage')
);
const ITServiceProvidersPage = lazyWithRetry(
  () => import('./pages/use-cases/ITServiceProvidersPage')
);
const SalesTeamsPage = lazyWithRetry(
  () => import('./pages/use-cases/SalesTeamsPage')
);
const ConsultingBusinessesPage = lazyWithRetry(
  () => import('./pages/use-cases/ConsultingBusinessesPage')
);

// Lazy load features pages
const AIChatPage = lazyWithRetry(() => import('./pages/features/AIChatPage'));
const AIDashboardsPage = lazyWithRetry(
  () => import('./pages/features/AIDashboardsPage')
);
const AIProjectManagerPage = lazyWithRetry(
  () => import('./pages/features/AIProjectManagerPage')
);

// Lazy load comparison pages
const VsChatGPTPage = lazyWithRetry(
  () => import('./pages/comparisons/VsChatGPTPage')
);
const VsClaudePage = lazyWithRetry(
  () => import('./pages/comparisons/VsClaudePage')
);

// Lazy load error and blog pages
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPostPage'));

// Loading component for Suspense fallback
const RouteLoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

function App() {
  // Initialize services in a controlled manner to prevent initialization conflicts
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize core services first
        monitoringService.initialize();
        accessibilityService.initialize();
        seoService.initialize();
        
        // Initialize analytics with a small delay
        setTimeout(() => {
          analyticsService.initialize();
        }, 100);
        
        // Initialize performance services with delay
        setTimeout(() => {
          performanceService.initialize({
            enableImageOptimization: true,
            enableCodeSplitting: true,
            enableResourcePreloading: true,
            enableServiceWorker: true,
            cacheStrategy: 'moderate',
          });
        }, 200);
        
        // Initialize advanced services with longer delay
        setTimeout(() => {
          backupService.initialize({
            enableAutomatedBackups: true,
            backupFrequency: 'daily',
            retentionDays: 30,
            enableCloudBackup: true,
            enableLocalBackup: false,
            cloudProvider: 'supabase',
            encryptionEnabled: true,
          });
          
          scalingService.initialize({
            enableLoadBalancing: true,
            enableCaching: true,
            enableCDN: true,
            enableDatabaseOptimization: true,
            enableResourcePooling: true,
            maxConcurrentRequests: 100,
            cacheStrategy: 'moderate',
            cdnProvider: 'cloudflare',
          });
          
          privacyService.initialize({
            enableConsentManagement: true,
            enableDataSubjectRequests: true,
            enableDataRetention: true,
            enableDataAnonymization: true,
            retentionPeriodDays: 2555, // 7 years
            enableAuditLogging: true,
          });
        }, 500);
        
      } catch (error) {
        console.error('Service initialization error:', error);
      }
    };
    
    initializeServices();
  }, []);

  // Monitor page performance
  usePagePerformanceMonitoring();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <ScrollToTop />
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <Suspense fallback={<RouteLoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicLayout />}>
                  <Route index element={<LandingPage />} />

                  {/* Marketing Pages */}
                  <Route path="blog" element={<BlogPage />} />
                  <Route path="blog/:slug" element={<BlogPostPage />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="help" element={<HelpPage />} />
                  <Route path="pricing" element={<PricingPage />} />
                  <Route path="contact-sales" element={<ContactSalesPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="careers" element={<CareersPage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="documentation" element={<DocumentationPage />} />
                  <Route path="api-reference" element={<APIReferencePage />} />
                  <Route
                    path="marketplace"
                    element={<MarketplacePublicPage />}
                  />
                  <Route path="setup-guide" element={<SetupGuidePage />} />

                  {/* Legal Pages */}
                  <Route
                    path="privacy-policy"
                    element={<PrivacyPolicyPage />}
                  />
                  <Route
                    path="terms-of-service"
                    element={<TermsOfServicePage />}
                  />
                  <Route path="cookie-policy" element={<CookiePolicyPage />} />

                  {/* Use Cases */}
                  <Route path="use-cases/startups" element={<StartupsPage />} />
                  <Route
                    path="use-cases/it-service-providers"
                    element={<ITServiceProvidersPage />}
                  />
                  <Route
                    path="use-cases/sales-teams"
                    element={<SalesTeamsPage />}
                  />
                  <Route
                    path="use-cases/consulting-businesses"
                    element={<ConsultingBusinessesPage />}
                  />

                  {/* Features */}
                  <Route path="features/ai-chat" element={<AIChatPage />} />
                  <Route
                    path="features/ai-dashboards"
                    element={<AIDashboardsPage />}
                  />
                  <Route
                    path="features/ai-project-manager"
                    element={<AIProjectManagerPage />}
                  />

                  {/* Comparison Pages */}
                  <Route path="vs-chatgpt" element={<VsChatGPTPage />} />
                  <Route path="vs-claude" element={<VsClaudePage />} />
                  <Route
                    path="chatgpt-alternative"
                    element={<VsChatGPTPage />}
                  />
                  <Route path="claude-alternative" element={<VsClaudePage />} />
                </Route>

                {/* Auth Routes - Both /auth/* and root level */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route
                    path="forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="reset-password"
                    element={<ResetPasswordPage />}
                  />
                </Route>

                {/* Root level auth routes for convenience */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
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

                  {/* Vibe Coding - Multi-Agent Orchestration */}
                  <Route path="vibe" element={<VibeCodingPage />} />

                  {/* Legacy Chat Routes (for backward compatibility) */}
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/:sessionId" element={<ChatPage />} />
                  <Route path="chat-agent" element={<ChatAgentPageChatKit />} />
                  <Route path="chat-multi" element={<TabbedLLMChatPage />} />

                  {/* Account & System at Root Level */}
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/:section" element={<SettingsPage />} />
                  <Route
                    path="settings/ai-configuration"
                    element={<AIConfigurationPage />}
                  />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="support" element={<HelpSupportPage />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>

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
    </ErrorBoundary>
  );
}

export default App;
