-- Compatibility views to satisfy code expecting public.conversations/public.messages
-- Map existing chat_sessions/chat_messages to generic names used by Chat UI

-- conversations view
create or replace view public.conversations as
select
  cs.id,
  cs.user_id,
  cs.title,
  cs.created_at
from public.chat_sessions cs;

-- messages view
create or replace view public.messages as
select
  cm.id,
  cm.session_id as conversation_id,
  null::uuid as user_id,
  cm.role::text as role,
  cm.content,
  '{}'::jsonb as metadata,
  cm.created_at
from public.chat_messages cm;

-- Indexes on views are not created; rely on underlying table indexes.


