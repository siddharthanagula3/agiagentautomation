import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import RealtimeNotification from './components/RealtimeNotification';

// Auth Components
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Simple loading fallback component with timeout
const LoadingFallback = () => {
  const [showError, setShowError] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 2000); // Show error after 2 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  if (showError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2">Loading is taking longer than expected</h2>
          <p className="text-gray-600 mb-4">This might be due to network issues.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
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
const EmployeesPage = lazy(() => import('./pages/dashboard/EmployeesPage'));
const WorkforcePage = lazy(() => import('./pages/dashboard/WorkforcePage'));
const AIEmployees = lazy(() => import('./pages/ai-employees/AIEmployees'));
const AIEmployeeChatPage = lazy(() => import('./pages/ai-employees/AIEmployeeChatPage'));
const JobsPage = lazy(() => import('./pages/dashboard/JobsPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const TeamPage = lazy(() => import('./pages/dashboard/TeamPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const SupportPage = lazy(() => import('./pages/dashboard/SupportPage'));
const IntegrationsPage = lazy(() => import('./pages/dashboard/IntegrationsPage'));

// Lazy load additional dashboard pages
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage'));
const WorkflowsPage = lazy(() => import('./pages/dashboard/WorkflowsPage'));
const APIKeysPage = lazy(() => import('./pages/dashboard/APIKeysPage'));
const WebhooksPage = lazy(() => import('./pages/dashboard/WebhooksPage'));
const LogsPage = lazy(() => import('./pages/dashboard/LogsPage'));
const MonitoringPage = lazy(() => import('./pages/dashboard/MonitoringPage'));
const BackupsPage = lazy(() => import('./pages/dashboard/BackupsPage'));
const SecurityPage = lazy(() => import('./pages/dashboard/SecurityPage'));
const CompliancePage = lazy(() => import('./pages/dashboard/CompliancePage'));
const AuditPage = lazy(() => import('./pages/dashboard/AuditPage'));
const PerformancePage = lazy(() => import('./pages/dashboard/PerformancePage'));
const ScalingPage = lazy(() => import('./pages/dashboard/ScalingPage'));
const HealthPage = lazy(() => import('./pages/dashboard/HealthPage'));
const IncidentsPage = lazy(() => import('./pages/dashboard/IncidentsPage'));
const MaintenancePage = lazy(() => import('./pages/dashboard/MaintenancePage'));
const UpdatesPage = lazy(() => import('./pages/dashboard/UpdatesPage'));
const VersionControlPage = lazy(() => import('./pages/dashboard/VersionControlPage'));
const DeploymentsPage = lazy(() => import('./pages/dashboard/DeploymentsPage'));
const TestingPage = lazy(() => import('./pages/dashboard/TestingPage'));
const QualityPage = lazy(() => import('./pages/dashboard/QualityPage'));
const ValidationPage = lazy(() => import('./pages/dashboard/ValidationPage'));
const StandardsPage = lazy(() => import('./pages/dashboard/StandardsPage'));
const BestPracticesPage = lazy(() => import('./pages/dashboard/BestPracticesPage'));
const GuidelinesPage = lazy(() => import('./pages/dashboard/GuidelinesPage'));
const ProceduresPage = lazy(() => import('./pages/dashboard/ProceduresPage'));
const ChecklistsPage = lazy(() => import('./pages/dashboard/ChecklistsPage'));
const TemplatesPage = lazy(() => import('./pages/dashboard/TemplatesPage'));
const ExamplesPage = lazy(() => import('./pages/dashboard/ExamplesPage'));
const UseCasesPage = lazy(() => import('./pages/dashboard/UseCasesPage'));
const PatternsPage = lazy(() => import('./pages/dashboard/PatternsPage'));
const ArchitecturePage = lazy(() => import('./pages/dashboard/ArchitecturePage'));
const DesignPage = lazy(() => import('./pages/dashboard/DesignPage'));
const ThemesPage = lazy(() => import('./pages/dashboard/ThemesPage'));
const LayoutsPage = lazy(() => import('./pages/dashboard/LayoutsPage'));
const ComponentsPage = lazy(() => import('./pages/dashboard/ComponentsPage'));
const WidgetsPage = lazy(() => import('./pages/dashboard/WidgetsPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ViewsPage = lazy(() => import('./pages/dashboard/ViewsPage'));
const ChartsPage = lazy(() => import('./pages/dashboard/ChartsPage'));
const GraphsPage = lazy(() => import('./pages/dashboard/GraphsPage'));
const VisualizationsPage = lazy(() => import('./pages/dashboard/VisualizationsPage'));
const DataPage = lazy(() => import('./pages/dashboard/DataPage'));
const ImportPage = lazy(() => import('./pages/dashboard/ImportPage'));
const ExportPage = lazy(() => import('./pages/dashboard/ExportPage'));
const ProcessingPage = lazy(() => import('./pages/dashboard/ProcessingPage'));
const AnalysisPage = lazy(() => import('./pages/dashboard/AnalysisPage'));
const InsightsPage = lazy(() => import('./pages/dashboard/InsightsPage'));
const RecommendationsPage = lazy(() => import('./pages/dashboard/RecommendationsPage'));
const OptimizationPage = lazy(() => import('./pages/dashboard/OptimizationPage'));
const TuningPage = lazy(() => import('./pages/dashboard/TuningPage'));
const ConfigurationPage = lazy(() => import('./pages/dashboard/ConfigurationPage'));
const ParametersPage = lazy(() => import('./pages/dashboard/ParametersPage'));
const PreferencesPage = lazy(() => import('./pages/dashboard/PreferencesPage'));
const PersonalizationPage = lazy(() => import('./pages/dashboard/PersonalizationPage'));
const CustomizationPage = lazy(() => import('./pages/dashboard/CustomizationPage'));
const AdvancedPage = lazy(() => import('./pages/dashboard/AdvancedPage'));
const ExpertPage = lazy(() => import('./pages/dashboard/ExpertPage'));
const ProfessionalPage = lazy(() => import('./pages/dashboard/ProfessionalPage'));
const EnterprisePage = lazy(() => import('./pages/dashboard/EnterprisePage'));
const BusinessPage = lazy(() => import('./pages/dashboard/BusinessPage'));
const StrategyPage = lazy(() => import('./pages/dashboard/StrategyPage'));
const PlanningPage = lazy(() => import('./pages/dashboard/PlanningPage'));
const SchedulingPage = lazy(() => import('./pages/dashboard/SchedulingPage'));
const TasksPage = lazy(() => import('./pages/dashboard/TasksPage'));
const AssignmentsPage = lazy(() => import('./pages/dashboard/AssignmentsPage'));
const ResponsibilitiesPage = lazy(() => import('./pages/dashboard/ResponsibilitiesPage'));
const RolesPage = lazy(() => import('./pages/dashboard/RolesPage'));
const PermissionsPage = lazy(() => import('./pages/dashboard/PermissionsPage'));
const AccessPage = lazy(() => import('./pages/dashboard/AccessPage'));
const ControlPage = lazy(() => import('./pages/dashboard/ControlPage'));
const ManagementPage = lazy(() => import('./pages/dashboard/ManagementPage'));
const AdministrationPage = lazy(() => import('./pages/dashboard/AdministrationPage'));
const SystemPage = lazy(() => import('./pages/dashboard/SystemPage'));
const PlatformPage = lazy(() => import('./pages/dashboard/PlatformPage'));
const InfrastructurePage = lazy(() => import('./pages/dashboard/InfrastructurePage'));
const ResourcesPage = lazy(() => import('./pages/dashboard/ResourcesPage'));
const AssetsPage = lazy(() => import('./pages/dashboard/AssetsPage'));
const CapabilitiesPage = lazy(() => import('./pages/dashboard/CapabilitiesPage'));
const DashboardFeaturesPage = lazy(() => import('./pages/dashboard/FeaturesPage'));
const FunctionalityPage = lazy(() => import('./pages/dashboard/FunctionalityPage'));
const OperationsPage = lazy(() => import('./pages/dashboard/OperationsPage'));
const ProcessesPage = lazy(() => import('./pages/dashboard/ProcessesPage'));
const OrchestrationPage = lazy(() => import('./pages/dashboard/OrchestrationPage'));
const CoordinationPage = lazy(() => import('./pages/dashboard/CoordinationPage'));
const SynchronizationPage = lazy(() => import('./pages/dashboard/SynchronizationPage'));
const AlignmentPage = lazy(() => import('./pages/dashboard/AlignmentPage'));

// Chat Interface
const ChatInterface = lazy(() => import('./pages/ChatInterface'));

// Error Pages
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => {
  return (
    <AuthProvider>
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
      </Suspense>
      
      {/* Real-time Notifications */}
      <RealtimeNotification />
    </AuthProvider>
  );
};

export default App;
