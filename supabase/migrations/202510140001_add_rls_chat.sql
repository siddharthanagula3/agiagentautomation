-- Secure chat tables with RLS and least-privilege policies

-- Enable RLS
alter table if exists public.chat_sessions enable row level security;
alter table if exists public.chat_messages enable row level security;

-- Policies for chat_sessions: owner can CRUD their own sessions
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_select_own'
  ) then
    create policy chat_sessions_select_own on public.chat_sessions
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_insert_own'
  ) then
    create policy chat_sessions_insert_own on public.chat_sessions
      for insert with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_update_own'
  ) then
    create policy chat_sessions_update_own on public.chat_sessions
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_delete_own'
  ) then
    create policy chat_sessions_delete_own on public.chat_sessions
      for delete using (user_id = auth.uid());
  end if;
end $$;

-- Policies for chat_messages: access via owning session
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_select_by_owner'
  ) then
    create policy chat_messages_select_by_owner on public.chat_messages
      for select using (
        exists (
          select 1 from public.chat_sessions s
          where s.id = chat_messages.session_id and s.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_insert_by_owner'
  ) then
    create policy chat_messages_insert_by_owner on public.chat_messages
      for insert with check (
        exists (
          select 1 from public.chat_sessions s
          where s.id = session_id and s.user_id = auth.uid()
        )
      );
  end if;
end $$;


