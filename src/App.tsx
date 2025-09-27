import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import RealtimeNotification from './components/RealtimeNotification';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FeaturesPage from './pages/FeaturesPage';
import LegalPage from './pages/LegalPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CareersPage from './pages/CareersPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import EmployeesPage from './pages/dashboard/EmployeesPage';
import WorkforcePage from './pages/dashboard/WorkforcePage';
import AIEmployees from './pages/ai-employees/AIEmployees';
import AIEmployeeChatPage from './pages/ai-employees/AIEmployeeChatPage';
import JobsPage from './pages/dashboard/JobsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import BillingPage from './pages/dashboard/BillingPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import TeamPage from './pages/dashboard/TeamPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import SupportPage from './pages/dashboard/SupportPage';
import IntegrationsPage from './pages/dashboard/IntegrationsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import WorkflowsPage from './pages/dashboard/WorkflowsPage';
import APIKeysPage from './pages/dashboard/APIKeysPage';
import WebhooksPage from './pages/dashboard/WebhooksPage';
import LogsPage from './pages/dashboard/LogsPage';
import MonitoringPage from './pages/dashboard/MonitoringPage';
import BackupsPage from './pages/dashboard/BackupsPage';
import SecurityPage from './pages/dashboard/SecurityPage';
import CompliancePage from './pages/dashboard/CompliancePage';
import AuditPage from './pages/dashboard/AuditPage';
import PerformancePage from './pages/dashboard/PerformancePage';
import ScalingPage from './pages/dashboard/ScalingPage';
import HealthPage from './pages/dashboard/HealthPage';
import IncidentsPage from './pages/dashboard/IncidentsPage';
import MaintenancePage from './pages/dashboard/MaintenancePage';
import UpdatesPage from './pages/dashboard/UpdatesPage';
import VersionControlPage from './pages/dashboard/VersionControlPage';
import DeploymentsPage from './pages/dashboard/DeploymentsPage';
import TestingPage from './pages/dashboard/TestingPage';
import QualityPage from './pages/dashboard/QualityPage';
import ValidationPage from './pages/dashboard/ValidationPage';
import StandardsPage from './pages/dashboard/StandardsPage';
import BestPracticesPage from './pages/dashboard/BestPracticesPage';
import GuidelinesPage from './pages/dashboard/GuidelinesPage';
import ProceduresPage from './pages/dashboard/ProceduresPage';
import ChecklistsPage from './pages/dashboard/ChecklistsPage';
import TemplatesPage from './pages/dashboard/TemplatesPage';
import ExamplesPage from './pages/dashboard/ExamplesPage';
import UseCasesPage from './pages/dashboard/UseCasesPage';
import PatternsPage from './pages/dashboard/PatternsPage';
import ArchitecturePage from './pages/dashboard/ArchitecturePage';
import DesignPage from './pages/dashboard/DesignPage';
import ThemesPage from './pages/dashboard/ThemesPage';
import LayoutsPage from './pages/dashboard/LayoutsPage';
import ComponentsPage from './pages/dashboard/ComponentsPage';
import WidgetsPage from './pages/dashboard/WidgetsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ViewsPage from './pages/dashboard/ViewsPage';
import ChartsPage from './pages/dashboard/ChartsPage';
import GraphsPage from './pages/dashboard/GraphsPage';
import VisualizationsPage from './pages/dashboard/VisualizationsPage';
import DataPage from './pages/dashboard/DataPage';
import ImportPage from './pages/dashboard/ImportPage';
import ExportPage from './pages/dashboard/ExportPage';
import ProcessingPage from './pages/dashboard/ProcessingPage';
import AnalysisPage from './pages/dashboard/AnalysisPage';
import InsightsPage from './pages/dashboard/InsightsPage';
import RecommendationsPage from './pages/dashboard/RecommendationsPage';
import OptimizationPage from './pages/dashboard/OptimizationPage';
import TuningPage from './pages/dashboard/TuningPage';
import ConfigurationPage from './pages/dashboard/ConfigurationPage';
import ParametersPage from './pages/dashboard/ParametersPage';
import PreferencesPage from './pages/dashboard/PreferencesPage';
import PersonalizationPage from './pages/dashboard/PersonalizationPage';
import CustomizationPage from './pages/dashboard/CustomizationPage';
import AdvancedPage from './pages/dashboard/AdvancedPage';
import ExpertPage from './pages/dashboard/ExpertPage';
import ProfessionalPage from './pages/dashboard/ProfessionalPage';
import EnterprisePage from './pages/dashboard/EnterprisePage';
import BusinessPage from './pages/dashboard/BusinessPage';
import StrategyPage from './pages/dashboard/StrategyPage';
import PlanningPage from './pages/dashboard/PlanningPage';
import SchedulingPage from './pages/dashboard/SchedulingPage';
import TasksPage from './pages/dashboard/TasksPage';
import AssignmentsPage from './pages/dashboard/AssignmentsPage';
import ResponsibilitiesPage from './pages/dashboard/ResponsibilitiesPage';
import RolesPage from './pages/dashboard/RolesPage';
import PermissionsPage from './pages/dashboard/PermissionsPage';
import AccessPage from './pages/dashboard/AccessPage';
import ControlPage from './pages/dashboard/ControlPage';
import ManagementPage from './pages/dashboard/ManagementPage';
import AdministrationPage from './pages/dashboard/AdministrationPage';
import SystemPage from './pages/dashboard/SystemPage';
import PlatformPage from './pages/dashboard/PlatformPage';
import InfrastructurePage from './pages/dashboard/InfrastructurePage';
import ResourcesPage from './pages/dashboard/ResourcesPage';
import AssetsPage from './pages/dashboard/AssetsPage';
import CapabilitiesPage from './pages/dashboard/CapabilitiesPage';
import DashboardFeaturesPage from './pages/dashboard/FeaturesPage';
import FunctionalityPage from './pages/dashboard/FunctionalityPage';
import OperationsPage from './pages/dashboard/OperationsPage';
import ProcessesPage from './pages/dashboard/ProcessesPage';
import OrchestrationPage from './pages/dashboard/OrchestrationPage';
import CoordinationPage from './pages/dashboard/CoordinationPage';
import SynchronizationPage from './pages/dashboard/SynchronizationPage';
import AlignmentPage from './pages/dashboard/AlignmentPage';

// Chat Interface (ChatGPT-like)
import ChatInterface from './pages/ChatInterface';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';

// Auth Components
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
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

        {/* Chat Interface (ChatGPT-like) */}
        <Route path="/chat" element={<ChatInterface />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          
          {/* Core Dashboard Pages */}
          <Route path="employees" element={<EmployeesPage />} />
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
          <Route path="support" element={<SupportPage />} />
          
          {/* Integration & API Pages */}
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="api-keys" element={<APIKeysPage />} />
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="logs" element={<LogsPage />} />
          
          {/* Monitoring & Operations */}
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="backups" element={<BackupsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="scaling" element={<ScalingPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="updates" element={<UpdatesPage />} />
          
          {/* Development & Deployment */}
          <Route path="version-control" element={<VersionControlPage />} />
          <Route path="deployments" element={<DeploymentsPage />} />
          <Route path="testing" element={<TestingPage />} />
          <Route path="quality" element={<QualityPage />} />
          <Route path="validation" element={<ValidationPage />} />
          
          {/* Standards & Best Practices */}
          <Route path="standards" element={<StandardsPage />} />
          <Route path="best-practices" element={<BestPracticesPage />} />
          <Route path="guidelines" element={<GuidelinesPage />} />
          <Route path="procedures" element={<ProceduresPage />} />
          <Route path="checklists" element={<ChecklistsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="examples" element={<ExamplesPage />} />
          <Route path="use-cases" element={<UseCasesPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          
          {/* Design & Architecture */}
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="design" element={<DesignPage />} />
          <Route path="themes" element={<ThemesPage />} />
          <Route path="layouts" element={<LayoutsPage />} />
          <Route path="components" element={<ComponentsPage />} />
          <Route path="widgets" element={<WidgetsPage />} />
          <Route path="dashboard-builder" element={<DashboardPage />} />
          <Route path="views" element={<ViewsPage />} />
          
          {/* Data & Analytics */}
          <Route path="charts" element={<ChartsPage />} />
          <Route path="graphs" element={<GraphsPage />} />
          <Route path="visualizations" element={<VisualizationsPage />} />
          <Route path="data" element={<DataPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="processing" element={<ProcessingPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="optimization" element={<OptimizationPage />} />
          <Route path="tuning" element={<TuningPage />} />
          
          {/* Configuration & Settings */}
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path="parameters" element={<ParametersPage />} />
          <Route path="preferences" element={<PreferencesPage />} />
          <Route path="personalization" element={<PersonalizationPage />} />
          <Route path="customization" element={<CustomizationPage />} />
          <Route path="advanced" element={<AdvancedPage />} />
          <Route path="expert" element={<ExpertPage />} />
          <Route path="professional" element={<ProfessionalPage />} />
          <Route path="enterprise" element={<EnterprisePage />} />
          
          {/* Business & Strategy */}
          <Route path="business" element={<BusinessPage />} />
          <Route path="strategy" element={<StrategyPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="responsibilities" element={<ResponsibilitiesPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="access" element={<AccessPage />} />
          
          {/* System & Platform */}
          <Route path="control" element={<ControlPage />} />
          <Route path="management" element={<ManagementPage />} />
          <Route path="administration" element={<AdministrationPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="platform" element={<PlatformPage />} />
          <Route path="infrastructure" element={<InfrastructurePage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="capabilities" element={<CapabilitiesPage />} />
          <Route path="features" element={<DashboardFeaturesPage />} />
          <Route path="functionality" element={<FunctionalityPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="processes" element={<ProcessesPage />} />
          <Route path="orchestration" element={<OrchestrationPage />} />
          <Route path="coordination" element={<CoordinationPage />} />
          <Route path="synchronization" element={<SynchronizationPage />} />
          <Route path="alignment" element={<AlignmentPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<TeamPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Real-time Notifications */}
      <RealtimeNotification />
    </AuthProvider>
  );
};

export default App;
