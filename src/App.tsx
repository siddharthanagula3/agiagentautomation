// src/App.tsx - CLEANED VERSION
import { Suspense, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@shared/ui/tooltip';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@shared/components/ThemeProvider';
import ScrollToTop from '@shared/components/ScrollToTop';
import { lazyWithRetry } from '@shared/components/LazyLoadWrapper';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import SkipLink from '@shared/components/accessibility/SkipLink';
import { CookieConsent } from '@shared/components/CookieConsent';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from '@features/auth/components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

// REACT FIX: Extract toast style options to prevent re-renders
const TOAST_OPTIONS = {
  style: {
    background: '#1F2937',
    color: '#F9FAFB',
    border: '1px solid #374151',
  },
} as const;

// === CORE PAGES ===
const LandingPage = lazyWithRetry(() => import('./pages/Landing'));
const PricingPage = lazyWithRetry(() => import('./pages/Pricing'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFound'));
const PublicMarketplacePage = lazyWithRetry(
  () => import('./pages/PublicMarketplace')
);
const AboutPage = lazyWithRetry(() => import('./pages/About'));
const CareersPage = lazyWithRetry(() => import('./pages/Careers'));
const BlogListPage = lazyWithRetry(() => import('./pages/BlogList'));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPost'));
const ContactSalesPage = lazyWithRetry(() => import('./pages/ContactSales'));
const HelpCenterPage = lazyWithRetry(() => import('./pages/HelpCenter'));
const DocumentationPage = lazyWithRetry(() => import('./pages/Documentation'));
const ApiReferencePage = lazyWithRetry(() => import('./pages/ApiReference'));
const SecurityPage = lazyWithRetry(() => import('./pages/Security'));
const ArtifactGalleryPage = lazyWithRetry(
  () => import('./pages/ArtifactGallery')
);
const SupportCenterPage = lazyWithRetry(() => import('./pages/SupportCenter'));

// === LEGAL PAGES ===
const PrivacyPolicyPage = lazyWithRetry(
  () => import('./pages/legal/PrivacyPolicy')
);
const TermsOfServicePage = lazyWithRetry(
  () => import('./pages/legal/TermsOfService')
);
const CookiePolicyPage = lazyWithRetry(
  () => import('./pages/legal/CookiePolicy')
);
const BusinessLegalPage = lazyWithRetry(
  () => import('./pages/legal/BusinessLegalPage')
);

// === FEATURE PAGES ===
const AIChatInterfacePage = lazyWithRetry(
  () => import('./pages/AIChatInterface')
);
const AIDashboardsPage = lazyWithRetry(() => import('./pages/AIDashboards'));
const AIProjectManagerPage = lazyWithRetry(
  () => import('./pages/AIProjectManager')
);

// === USE CASE PAGES ===
const StartupsPage = lazyWithRetry(() => import('./pages/use-cases/Startups'));
const ConsultingBusinessesPage = lazyWithRetry(
  () => import('./pages/use-cases/ConsultingBusinesses')
);
const ITServiceProvidersPage = lazyWithRetry(
  () => import('./pages/use-cases/ITServiceProviders')
);
const SalesTeamsPage = lazyWithRetry(
  () => import('./pages/use-cases/SalesTeams')
);

// === RESOURCES PAGE ===
const ResourcesPage = lazyWithRetry(() => import('./pages/Resources'));

// === AUTH PAGES ===
const LoginPage = lazyWithRetry(() => import('@features/auth/pages/Login'));
const RegisterPage = lazyWithRetry(
  () => import('@features/auth/pages/Register')
);
const ForgotPasswordPage = lazyWithRetry(
  () => import('@features/auth/pages/ForgotPassword')
);
const ResetPasswordPage = lazyWithRetry(
  () => import('@features/auth/pages/ResetPassword')
);

// === DASHBOARD PAGES ===
const DashboardHomePage = lazyWithRetry(() => import('./pages/DashboardHome'));
const ChatPage = lazyWithRetry(
  () => import('@features/chat/pages/ChatInterface')
);
const SettingsPage = lazyWithRetry(
  () => import('@features/settings/pages/UserSettings')
);
const AIConfigurationPage = lazyWithRetry(
  () => import('@features/settings/pages/AIConfiguration')
);

// === OPTIONAL FEATURES (Comment out to disable) ===
const EmployeeManagement = lazyWithRetry(
  () => import('@features/workforce/pages/EmployeeManagement')
);
const MissionControlPage = lazyWithRetry(
  () => import('@features/mission-control/pages/MissionControlDashboard')
);
const BillingPage = lazyWithRetry(
  () => import('@features/billing/pages/BillingDashboard')
);
const EmployeeMarketplacePage = lazyWithRetry(
  () => import('@features/marketplace/pages/EmployeeMarketplace')
);
const VibeDashboard = lazyWithRetry(
  () => import('@features/vibe/pages/VibeDashboard')
);

// Loading component for Suspense fallback
const RouteLoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

// Updated: Jan 15th 2026 - Removed console statements for production
function App() {
  // Simple initialization
  useEffect(() => {
    // App initialization complete
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <ScrollToTop />
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <Suspense fallback={<RouteLoadingSpinner />}>
              <Routes>
                {/* ===== PUBLIC ROUTES ===== */}
                <Route path="/" element={<PublicLayout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="pricing" element={<PricingPage />} />
                  <Route
                    path="marketplace"
                    element={<PublicMarketplacePage />}
                  />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="careers" element={<CareersPage />} />
                  <Route path="blog" element={<BlogListPage />} />
                  <Route path="blog/:slug" element={<BlogPostPage />} />
                  <Route path="contact-sales" element={<ContactSalesPage />} />
                  <Route
                    path="help"
                    element={
                      <ErrorBoundary>
                        <HelpCenterPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="documentation" element={<DocumentationPage />} />
                  <Route path="api-reference" element={<ApiReferencePage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="gallery" element={<ArtifactGalleryPage />} />

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
                  <Route path="legal" element={<BusinessLegalPage />} />

                  {/* Feature Pages */}
                  <Route
                    path="features/ai-chat"
                    element={<AIChatInterfacePage />}
                  />
                  <Route
                    path="features/ai-dashboards"
                    element={<AIDashboardsPage />}
                  />
                  <Route
                    path="features/ai-project-manager"
                    element={<AIProjectManagerPage />}
                  />

                  {/* Use Case Pages */}
                  <Route path="use-cases/startups" element={<StartupsPage />} />
                  <Route
                    path="use-cases/consulting"
                    element={<ConsultingBusinessesPage />}
                  />
                  <Route
                    path="use-cases/it-providers"
                    element={<ITServiceProvidersPage />}
                  />
                  <Route
                    path="use-cases/sales-teams"
                    element={<SalesTeamsPage />}
                  />

                  {/* Resources */}
                  <Route path="resources" element={<ResourcesPage />} />

                  {/* Demo - Redirect to Contact Sales */}
                  <Route path="demo" element={<Navigate to="/contact-sales" replace />} />
                </Route>

                {/* ===== AUTH ROUTES ===== */}
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

                {/* ===== VIBE - Standalone Multi-Agent Workspace (Protected) ===== */}
                <Route
                  path="/vibe"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <VibeDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* ===== PROTECTED ROUTES (Requires Login) ===== */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard */}
                  <Route
                    path="dashboard"
                    element={
                      <ErrorBoundary>
                        <DashboardHomePage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Chat Interface - Main Feature */}
                  <Route
                    path="chat"
                    element={
                      <ErrorBoundary>
                        <ChatPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="chat/:sessionId"
                    element={
                      <ErrorBoundary>
                        <ChatPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Optional Features - Comment out to disable */}
                  <Route
                    path="workforce"
                    element={
                      <ErrorBoundary>
                        <EmployeeManagement />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="mission-control"
                    element={
                      <ErrorBoundary>
                        <MissionControlPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="company-hub"
                    element={
                      <ErrorBoundary>
                        <MissionControlPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Employee Marketplace (Protected) - Renamed to avoid conflict with public /marketplace */}
                  <Route
                    path="hire"
                    element={
                      <ErrorBoundary>
                        <EmployeeMarketplacePage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Settings */}
                  <Route
                    path="settings"
                    element={
                      <ErrorBoundary>
                        <SettingsPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="settings/ai-configuration"
                    element={
                      <ErrorBoundary>
                        <AIConfigurationPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="settings/:section"
                    element={
                      <ErrorBoundary>
                        <SettingsPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Billing */}
                  <Route
                    path="billing"
                    element={
                      <ErrorBoundary>
                        <BillingPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Support Center */}
                  <Route
                    path="support"
                    element={
                      <ErrorBoundary>
                        <SupportCenterPage />
                      </ErrorBoundary>
                    }
                  />
                </Route>

                {/* ===== 404 ROUTE ===== */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>

            {/* Toaster for notifications */}
            <Toaster
              position="bottom-right"
              theme="dark"
              className="toaster"
              toastOptions={TOAST_OPTIONS}
            />
          </div>

          {/* Cookie Consent Banner */}
          <CookieConsent />

          {/* React Query Dev Tools (dev only) */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
