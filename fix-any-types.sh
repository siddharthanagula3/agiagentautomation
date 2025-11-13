#!/bin/bash
# Script to fix all 'any' type ESLint errors

echo "Fixing all 'any' type errors..."

# Fix multi-agent-chat.ts - Replace 'any' with 'unknown' or proper types
sed -i 's/metadata: Record<string, any>/metadata: Record<string, unknown>/g' src/shared/types/multi-agent-chat.ts
sed -i 's/capabilities: any\[\]/capabilities: string[]/g' src/shared/types/multi-agent-chat.ts
sed -i 's/workflow_steps: any\[\]/workflow_steps: unknown[]/g' src/shared/types/multi-agent-chat.ts
sed -i 's/collaboration_result: any | null/collaboration_result: unknown | null/g' src/shared/types/multi-agent-chat.ts
sed -i 's/output_artifacts: any\[\]/output_artifacts: unknown[]/g' src/shared/types/multi-agent-chat.ts
sed -i 's/ui_settings: Record<string, any>/ui_settings: Record<string, unknown>/g' src/shared/types/multi-agent-chat.ts

# Fix hook files
sed -i 's/metadata?: Record<string, any>/metadata?: Record<string, unknown>/g' src/shared/types/multi-agent-chat.ts
sed -i 's/capabilities?: any\[\]/capabilities?: string[]/g' src/shared/types/multi-agent-chat.ts
sed -i 's/workflow_steps?: any\[\]/workflow_steps?: unknown[]/g' src/shared/types/multi-agent-chat.ts
sed -i 's/output_artifacts?: any\[\]/output_artifacts?: unknown[]/g' src/shared/types/multi-agent-chat.ts

# Fix database files - use unknown for generic JSON data
find src/core/storage -name "*.ts" -exec sed -i 's/: any;/: unknown;/g' {} \;
find src/core/storage -name "*.ts" -exec sed -i 's/: any\[\]/: unknown[]/g' {} \;
find src/core/storage -name "*.ts" -exec sed -i 's/: any |/: unknown |/g' {} \;

# Fix realtime-collaboration.ts
sed -i 's/metadata?: any/metadata?: unknown/g' src/features/chat/services/realtime-collaboration.ts
sed -i 's/data: any/data: unknown/g' src/features/chat/services/realtime-collaboration.ts

# Fix enhanced-chat-synchronization-service.ts - add proper error handling
sed -i 's/} catch (error: any)/} catch (error: unknown)/g' src/features/chat/services/enhanced-chat-synchronization-service.ts
sed -i 's/error: any/error: unknown/g' src/features/chat/services/enhanced-chat-synchronization-service.ts

# Fix date-utils.ts
sed -i 's/value: any/value: unknown/g' src/shared/lib/date-utils.ts

# Fix rate-limiter.ts
sed -i 's/error: any/error: unknown/g' netlify/functions/utils/rate-limiter.ts

# Fix sse-handler.ts
sed -i 's/data: any/data: unknown/g' src/core/ai/streaming/sse-handler.ts

# Fix offline-sync-manager.ts
sed -i 's/data: any/data: unknown/g' src/core/offline/offline-sync-manager.ts
sed -i 's/error: any/error: unknown/g' src/core/offline/offline-sync-manager.ts

echo "Fixed all 'any' type errors"
