import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// AuthProvider removed - using Zustand store directly
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import RealtimeNotification from './components/RealtimeNotification';
import DemoModeBanner from './components/DemoModeBanner';
import HideLoader from './components/HideLoader';
import AuthDebugger from './components/AuthDebugger';

// Auth Components
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Simple loading fallback component
const LoadingFallback = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading component...</p>
      </div>
    </div>
  );
};

// Lazy load public pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));

// Lazy load auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Lazy load core dashboard pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const AIEmployees = lazy(() => import('./pages/ai-employees/AIEmployees'));
const AIEmployeeChatPage = lazy(() => import('./pages/ai-employees/AIEmployeeChatPage'));
const WorkforcePage = lazy(() => import('./pages/dashboard/WorkforcePage'));
const JobsPage = lazy(() => import('./pages/dashboard/JobsPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const TeamPage = lazy(() => import('./pages/dashboard/TeamPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

// Lazy load additional dashboard pages
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage'));
const APIKeysPage = lazy(() => import('./pages/dashboard/APIKeysPage'));
const WebhooksPage = lazy(() => import('./pages/dashboard/WebhooksPage'));
const LogsPage = lazy(() => import('./pages/dashboard/LogsPage'));
const ProcessingPage = lazy(() => import('./pages/dashboard/ProcessingPage'));

// Chat Interface
const ChatInterface = lazy(() => import('./pages/ChatInterface'));

// Error Pages
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => {
  return (
    <>
      <HideLoader />
      <DemoModeBanner />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="legal" element={<LegalPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:id" element={<BlogPostPage />} />
            <Route path="careers" element={<CareersPage />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Chat Interface */}
          <Route path="/chat" element={<ChatInterface />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            
            {/* Core Dashboard Pages */}
            <Route path="ai-employees" element={<AIEmployees />} />
            <Route path="ai-employees/chat/:employeeId" element={<AIEmployeeChatPage />} />
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Additional Dashboard Pages */}
            <Route path="reports" element={<ReportsPage />} />
            <Route path="api-keys" element={<APIKeysPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="processing" element={<ProcessingPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <RealtimeNotification />
      <AuthDebugger />
    </>
  );
};

export default App;