# 📊 Supabase Database Setup Guide

## 🚀 Quick Setup

### Step 1: Run the SQL Schema

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)

**Expected Result:**
- 4 tables created (purchased_employees, chat_sessions, chat_messages, notifications)
- RLS policies enabled on all tables
- Triggers and functions created
- Verification query shows all 4 tables

---

## 📋 What Gets Created

### Tables

#### 1. **purchased_employees**
Stores which AI employees each user has purchased
- `id` - Unique identifier
- `user_id` - Links to authenticated user
- `employee_id` - Links to AI employee (emp-001, emp-002, etc.)
- `role` - Employee role name
- `provider` - AI provider (chatgpt, claude, gemini, perplexity)
- `purchased_at` - When employee was hired
- `is_active` - Whether employee is active

#### 2. **chat_sessions**
Stores chat conversations
- `id` - Unique session identifier
- `user_id` - Links to user
- `employee_id` - Which employee they're chatting with
- `role` - Employee role
- `provider` - AI provider
- `title` - Chat title
- `last_message_at` - Timestamp of last message

#### 3. **chat_messages**
Stores individual messages
- `id` - Unique message identifier
- `session_id` - Links to chat session
- `role` - 'user' or 'assistant' or 'system'
- `content` - Message text
- `created_at` - When message was sent

#### 4. **notifications**
Stores user notifications
- `id` - Unique identifier
- `user_id` - Links to user
- `type` - info, success, warning, error
- `title` - Notification title
- `message` - Notification content
- `is_read` - Whether user has read it
- `link` - Optional link

---

## 🔒 Security (RLS)

**Row Level Security (RLS)** is enabled on all tables. This means:

✅ Users can only see/modify their own data
✅ No user can access another user's purchased employees
✅ No user can read another user's chat messages
✅ All data is automatically secured by user_id

---

## 🎯 Next Steps: Update Your Code

After running the SQL, you need to update your React code to use Supabase instead of localStorage.

### Create Supabase Service File

Create `src/services/supabase-employees.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export interface PurchasedEmployee {
  id: string;
  user_id: string;
  employee_id: string;
  role: string;
  provider: string;
  purchased_at: string;
  is_active: boolean;
}

// Get all purchased employees for current user
export async function getPurchasedEmployees(): Promise<PurchasedEmployee[]> {
  const { data, error } = await supabase
    .from('purchased_employees')
    .select('*')
    .eq('is_active', true)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchased employees:', error);
    return [];
  }

  return data || [];
}

// Purchase an employee
export async function purchaseEmployee(
  employeeId: string,
  role: string,
  provider: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('purchased_employees')
    .insert({
      user_id: user.id,
      employee_id: employeeId,
      role: role,
      provider: provider
    });

  if (error) {
    // Check if already purchased
    if (error.code === '23505') {
      return { success: false, error: 'Already purchased' };
    }
    console.error('Error purchasing employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Check if employee is purchased
export async function isEmployeePurchased(employeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('purchased_employees')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .single();

  return !error && data !== null;
}
```

### Create Chat Service

Create `src/services/supabase-chat.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export interface ChatSession {
  id: string;
  user_id: string;
  employee_id: string;
  role: string;
  provider: string;
  title: string | null;
  is_active: boolean;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// Get all chat sessions
export async function getChatSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('is_active', true)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }

  return data || [];
}

// Create new chat session
export async function createChatSession(
  employeeId: string,
  role: string,
  provider: string,
  title?: string
): Promise<ChatSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user.id,
      employee_id: employeeId,
      role: role,
      provider: provider,
      title: title || role
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat session:', error);
    return null;
  }

  return data;
}

// Get messages for a session
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

// Add message to session
export async function addChatMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role: role,
      content: content
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    return null;
  }

  return data;
}

// Delete chat session
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_active: false })
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }

  return true;
}
```

---

## 🔄 Migration from localStorage

If you already have data in localStorage, you can migrate it:

```typescript
// Migration function (run once)
async function migrateFromLocalStorage() {
  const purchased = JSON.parse(localStorage.getItem('purchasedEmployees') || '[]');
  
  for (const emp of purchased) {
    await purchaseEmployee(emp.id, emp.role, emp.provider);
  }
  
  // Clear localStorage after migration
  localStorage.removeItem('purchasedEmployees');
  
  console.log('Migration complete!');
}
```

---

## 🧪 Testing Your Setup

### Test 1: Check Tables
```sql
-- Run in Supabase SQL Editor
SELECT * FROM purchased_employees;
SELECT * FROM chat_sessions;
SELECT * FROM chat_messages;
SELECT * FROM notifications;
```

### Test 2: Purchase Employee (via code)
```typescript
const result = await purchaseEmployee('emp-001', 'Software Architect', 'claude');
console.log(result); // { success: true }
```

### Test 3: Get Purchased Employees
```typescript
const employees = await getPurchasedEmployees();
console.log(employees); // Should show your purchased employees
```

---

## 📊 Database Relationships

```
auth.users (Supabase Auth)
    |
    └── purchased_employees
            |
            └── chat_sessions
                    |
                    └── chat_messages
    
    └── notifications
```

---

## 🎨 Optional: Add Indexes for Performance

If you have many users, add these indexes:

```sql
-- Better performance for large datasets
CREATE INDEX idx_chat_messages_session_created 
ON chat_messages(session_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);
```

---

## ❓ Troubleshooting

### "Permission denied" errors
- Make sure RLS policies are enabled
- Check that you're authenticated with Supabase
- Verify `auth.uid()` returns your user ID

### "Relation does not exist" errors
- Make sure you ran the SQL schema
- Check table names are correct (lowercase)
- Refresh Supabase dashboard

### No data showing up
- Check user is authenticated: `supabase.auth.getUser()`
- Verify data exists: Query in SQL Editor
- Check browser console for errors

---

## 🚀 You're All Set!

Your database is now ready to store:
- ✅ Purchased AI employees
- ✅ Chat sessions and messages
- ✅ Notifications
- ✅ All user data securely with RLS

Next: Update your React code to use the Supabase services instead of localStorage!
