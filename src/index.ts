/**
 * Component Index - Export all major components
 */

// Dashboard Components
export { default as DashboardHomePage } from './components/dashboard/DashboardHomePage';

// Chat Components
export { default as MultiTabChatInterface } from './components/chat/MultiTabChatInterface';

// Automation Components
export { default as VisualWorkflowDesigner } from './components/automation/VisualWorkflowDesigner';
export { default as IntegrationSettingsPanel } from './components/automation/IntegrationSettingsPanel';

// Employee/Workforce Components
export { default as WorkforceManagement } from './components/employees/WorkforceManagement';

// Page Components
// export { default as WorkforcePage } from './pages/workforce/WorkforcePage'; // Removed
export { default as ChatPage } from './pages/chat/ChatPage';
export { default as AutomationPage } from './pages/automation/AutomationPage';
export { default as IntegrationsPage } from './pages/integrations/IntegrationsPage';
export { default as AnalyticsPage } from './pages/analytics/AnalyticsPage';
export { default as SettingsPage } from './pages/settings/SettingsPage';
export { default as AutonomousWorkflowsPage } from './pages/autonomous/AutonomousWorkflowsPage';

// Integration Utilities
export * from './integrations/tool-integrations';

// Layout Components
export { DashboardLayout } from './layouts/DashboardLayout';
export { DashboardSidebar } from './components/layout/DashboardSidebar';

// Types
export type {
  IntegrationType,
  ToolIntegration,
  AuthenticationConfig,
  RateLimit,
  CostStructure,
  UsageStats,
  ToolExecutionContext,
  ToolExecutionResult,
} from './integrations/tool-integrations';
