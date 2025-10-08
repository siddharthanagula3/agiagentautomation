-- Idempotent creation of conversations/messages to satisfy ChatKit/Agent UI

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_conversations_user_id on public.conversations(user_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='read own conv') then
    create policy "read own conv" on public.conversations for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='insert own conv') then
    create policy "insert own conv" on public.conversations for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='read own msgs') then
    create policy "read own msgs" on public.messages for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='insert own msgs') then
    create policy "insert own msgs" on public.messages
      for insert with check (
        auth.uid() = user_id and
        exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
      );
  end if;
end $$;


