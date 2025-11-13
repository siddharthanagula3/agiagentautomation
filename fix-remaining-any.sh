#!/bin/bash
# Fix remaining specific any types

# Fix rate-limiter.ts - error objects
sed -i '142s/error: any/error: unknown/' netlify/functions/utils/rate-limiter.ts
sed -i '143s/err: any/err: unknown/' netlify/functions/utils/rate-limiter.ts

# Fix offline-sync-manager.ts - data and error types
sed -i '75s/data: any/data: Record<string, unknown>/' src/core/offline/offline-sync-manager.ts
sed -i '99s/data: any/data: Record<string, unknown>/' src/core/offline/offline-sync-manager.ts
sed -i '282s/error: any/error: unknown/' src/core/offline/offline-sync-manager.ts

# Fix chat-realtime-subscriptions.ts
sed -i '33s/payload: any/payload: Record<string, unknown>/' src/core/storage/chat/chat-realtime-subscriptions.ts
sed -i '339s/changes: any/changes: Record<string, unknown>/' src/core/storage/chat/chat-realtime-subscriptions.ts
sed -i '340s/error: any/error: unknown/' src/core/storage/chat/chat-realtime-subscriptions.ts

# Fix collaboration-database.ts
sed -i '256s/data: any/data: Record<string, unknown>/' src/core/storage/chat/collaboration-database.ts
sed -i '272s/session: any/session: Record<string, unknown>/' src/core/storage/chat/collaboration-database.ts
sed -i '314s/error: any/error: unknown/' src/core/storage/chat/collaboration-database.ts
sed -i '354s/error: any/error: unknown/' src/core/storage/chat/collaboration-database.ts
sed -i '628s/error: any/error: unknown/' src/core/storage/chat/collaboration-database.ts

# Fix enhanced-chat-synchronization-service.ts - all error: any
find src/features/chat/services/enhanced-chat-synchronization-service.ts -exec sed -i 's/error: any/error: unknown/g' {} \;
find src/features/chat/services/enhanced-chat-synchronization-service.ts -exec sed -i 's/err: any/err: unknown/g' {} \;

# Fix realtime-collaboration.ts
sed -i '75s/metadata: any/metadata: Record<string, unknown>/' src/features/chat/services/realtime-collaboration.ts
sed -i '232s/data: any/data: Record<string, unknown>/' src/features/chat/services/realtime-collaboration.ts
sed -i '247s/error: any/error: unknown/' src/features/chat/services/realtime-collaboration.ts
sed -i '287s/error: any/error: unknown/' src/features/chat/services/realtime-collaboration.ts
sed -i '311s/metadata: any/metadata: Record<string, unknown>/' src/features/chat/services/realtime-collaboration.ts

# Fix multi-agent-chat.ts
sed -i '248s/data: any/data: Record<string, unknown>/' src/shared/types/multi-agent-chat.ts
sed -i '398s/\[\]: any/\[\]: unknown/' src/shared/types/multi-agent-chat.ts

echo "Fixed all remaining any types"
