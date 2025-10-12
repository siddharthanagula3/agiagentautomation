import supabaseClient from '@/integrations/supabase/client';

export interface ChatSessionRecord {
  id: string; // uuid
  user_id: string;
  employee_id: string;
  role: string;
  provider: string;
  created_at: string;
}

export interface ChatMessageRecord {
  id: string; // uuid
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

function getUserIdOrThrow(userId?: string | null): string {
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

export async function createSession(
  userId: string | null | undefined,
  params: { employeeId: string; role: string; provider: string }
): Promise<ChatSessionRecord> {
  const uid = getUserIdOrThrow(userId);
  const { employeeId, role, provider } = params;
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: uid, employee_id: employeeId, role, provider })
    .select('*')
    .single();
  if (error) throw error;
  return data as ChatSessionRecord;
}

export async function listSessions(
  userId: string | null | undefined
): Promise<ChatSessionRecord[]> {
  const uid = getUserIdOrThrow(userId);
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ChatSessionRecord[];
}

export async function listMessages(
  userId: string | null | undefined,
  sessionId: string
): Promise<ChatMessageRecord[]> {
  getUserIdOrThrow(userId); // validate auth; RLS enforces access
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ChatMessageRecord[];
}

export async function sendMessage(
  userId: string | null | undefined,
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessageRecord> {
  getUserIdOrThrow(userId); // validate auth; RLS enforces access
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })
    .select('*')
    .single();
  if (error) throw error;
  return data as ChatMessageRecord;
}
