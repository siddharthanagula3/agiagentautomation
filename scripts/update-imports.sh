#!/bin/bash

# Script to update all import paths after refactoring

echo "Updating import paths..."

# Update references to moved services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/llm-providers/|from '@core/api/llm/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/ai-service'|from '@core/api/ai-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/ai-chat-service'|from '@core/api/ai-chat-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/ai-employee-service'|from '@core/api/ai-employee-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/ai/|from '@core/api/ai/|g" {} +

# Update monitoring services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/analytics-service'|from '@core/monitoring/analytics-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/performance-service'|from '@core/monitoring/performance-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/monitoring-service'|from '@core/monitoring/monitoring-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/accessibility-service'|from '@core/monitoring/accessibility-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/seo-service'|from '@core/monitoring/seo-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/privacy-service'|from '@core/monitoring/privacy-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/scaling-service'|from '@core/monitoring/scaling-service'|g" {} +

# Update orchestration services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/orchestration/|from '@core/orchestration/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/multi-agent-orchestrator'|from '@core/orchestration/multi-agent-orchestrator'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/workforce-orchestrator'|from '@core/orchestration/workforce-orchestrator'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/reasoning/|from '@core/orchestration/reasoning/|g" {} +

# Update storage services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/cache-service'|from '@core/storage/cache-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/backup-service'|from '@core/storage/backup-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/chat-persistence-service'|from '@core/storage/chat-persistence-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/chat-sync-service'|from '@core/storage/chat-sync-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/supabase/|from '@core/storage/supabase/|g" {} +

# Update security services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/auth-service'|from '@core/security/auth-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/security/|from '@core/security/|g" {} +

# Update feature-specific services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/billing/|from '@features/billing/services/billing/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/stripe-service'|from '@features/billing/services/stripe-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/token-tracking-service'|from '@features/billing/services/token-tracking-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/background-chat-service'|from '@features/chat/services/background-chat-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/streaming-service'|from '@features/chat/services/streaming-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/supabase-chat'|from '@features/chat/services/supabase-chat'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/supabase-employees'|from '@features/workforce/services/supabase-employees'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/settings-service'|from '@features/settings/services/settings-service'|g" {} +

# Update tool services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/mcp-tools-service'|from '@core/api/mcp-tools-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/provider-tools-integration'|from '@core/api/provider-tools-integration'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/tool-executor-service'|from '@core/api/tool-executor-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/tool-invocation-service'|from '@core/api/tool-invocation-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/web-search-service'|from '@core/api/web-search-service'|g" {} +

# Update API services
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/artifact-service'|from '@core/api/artifact-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/context-management-service'|from '@core/api/context-management-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/system-prompts-service'|from '@core/api/system-prompts-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/marketing-api'|from '@core/api/marketing-api'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/real-data-service'|from '@core/api/real-data-service'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/services/media-generation-service'|from '@core/api/media-generation-service'|g" {} +

# Update component imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/ui/|from '@shared/ui/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/accessibility/|from '@shared/components/accessibility/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/accessible/|from '@shared/components/accessibility/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/dashboard/|from '@shared/components/dashboard/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/layout/|from '@shared/components/layout/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/seo/|from '@shared/components/seo/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/optimized/|from '@shared/components/optimized/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/ErrorBoundary'|from '@shared/components/ErrorBoundary'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/LazyWrapper'|from '@shared/components/LazyWrapper'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/ScrollToTop'|from '@shared/components/ScrollToTop'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/theme-provider'|from '@shared/components/theme-provider'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/theme-constants'|from '@shared/components/theme-constants'|g" {} +

# Update feature component imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/auth/|from '@features/auth/components/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/chat/|from '@features/chat/components/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/ai-employees/|from '@features/workforce/components/ai-employees/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/employees/|from '@features/workforce/components/employees/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/workforce/|from '@features/workforce/components/workforce/|g" {} +

# Update core component imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/agents/|from '@core/orchestration/components/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/backup/|from '@core/storage/components/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/performance/|from '@core/monitoring/components/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/privacy/|from '@core/monitoring/components/privacy/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/components/scaling/|from '@core/monitoring/components/scaling/|g" {} +

# Update hooks, utils, types, lib, stores
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/hooks/|from '@shared/hooks/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/utils/|from '@shared/utils/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/types/|from '@shared/types/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/lib/|from '@shared/lib/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/stores/|from '@shared/stores/|g" {} +

# Update page imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/auth/|from '@features/auth/pages/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/chat/|from '@features/chat/pages/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/workforce/|from '@features/workforce/pages/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/settings/|from '@features/settings/pages/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/marketplace/|from '@features/marketplace/pages/|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/dashboard/BillingPage'|from '@features/billing/pages/BillingPage'|g" {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/pages/dashboard/HelpSupportPage'|from '@features/settings/pages/HelpSupportPage'|g" {} +

echo "Import path updates complete!"
