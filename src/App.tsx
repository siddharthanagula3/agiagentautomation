// src/App.tsx - CLEANED VERSION
import { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
const ChatPage = lazyWithRetry(() => import('@features/chat/pages/ChatInterface'));
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
  // Simple initialization
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('✓ App initialized successfully');
    }
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
                  <Route path="help" element={<HelpCenterPage />} />
                  <Route path="documentation" element={<DocumentationPage />} />
                  <Route path="api-reference" element={<ApiReferencePage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="gallery" element={<ArtifactGalleryPage />} />
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

                {/* Root level auth routes for convenience */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                  <Route path="dashboard" element={<DashboardHomePage />} />

                  {/* Chat Interface - Main Feature */}
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/:sessionId" element={<ChatPage />} />

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
                    element={<MissionControlPage />}
                  />
                  <Route path="company-hub" element={<MissionControlPage />} />

                  {/* Settings */}
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/:section" element={<SettingsPage />} />
                  <Route
                    path="settings/ai-configuration"
                    element={<AIConfigurationPage />}
                  />

                  {/* Billing */}
                  <Route path="billing" element={<BillingPage />} />
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
              toastOptions={{
                style: {
                  background: '#1F2937',
                  color: '#F9FAFB',
                  border: '1px solid #374151',
                },
              }}
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
