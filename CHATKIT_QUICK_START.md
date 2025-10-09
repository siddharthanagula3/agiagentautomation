# 🚀 ChatKit Quick Start Guide

## 5-Minute Setup

Get ChatKit working with your AI Employees in 5 steps!

---

## Step 1: Environment Variables (2 minutes)

Add to Netlify:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Important:** Use the API key from the **same organization** as your Agent Builder!

---

## Step 2: Create Workflows in Agent Builder (10 minutes per workflow)

1. Go to: https://platform.openai.com/agent-builder
2. Click "Create New Workflow"
3. Configure your workflow:
   ```
   Name: Data Analyst Assistant
   Model: GPT-4o
   Instructions: "You are a professional data analyst..."
   Tools: Code Interpreter, Web Search
   ```
4. Save and copy the `workflow_id` (looks like: `flow_abc123xyz`)

**Repeat for each employee role type you have**

---

## Step 3: Add Workflow IDs to Database (5 minutes)

### Option A: Quick SQL (Recommended)

Run in Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID and WORKFLOW_IDs
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  '"flow_YOUR_WORKFLOW_ID"'::jsonb
)
WHERE user_id = 'YOUR_USER_ID'
  AND role = 'Data Analyst';
```

### Option B: Use the Provided Script

1. Open `supabase/add_workflow_ids.sql`
2. Replace `YOUR_USER_ID` with your user ID
3. Replace workflow IDs with your actual IDs
4. Run in Supabase

---

## Step 4: Test It! (1 minute)

```bash
# Start dev server
npm run dev

# Visit (replace with your employee ID)
http://localhost:5173/chat-agent?employee=YOUR_EMPLOYEE_ID
```

**You should see:**
- ✅ Clean chat interface
- ✅ "Connecting to {Employee Name}..."
- ✅ ChatKit loads
- ✅ You can start chatting!

---

## Step 5: Deploy (1 minute)

```bash
git add -A
git commit -m "Add workflow IDs"
git push origin main
```

Netlify will auto-deploy in ~1 minute!

---

## 🎯 Testing Checklist

After setup, verify:

- [ ] Environment variable set in Netlify
- [ ] Workflows created in Agent Builder
- [ ] Workflow IDs added to employee metadata
- [ ] Page loads without errors
- [ ] Can send messages
- [ ] Responses appear
- [ ] Theme switches work (light/dark)

---

## 🐛 Common Issues

### 1. "No workflow ID configured"

**Fix:**
```sql
-- Check current metadata
SELECT id, name, role, metadata
FROM purchased_employees
WHERE user_id = 'YOUR_USER_ID';

-- Add workflow ID
UPDATE purchased_employees
SET metadata = '{"workflow_id": "flow_YOUR_ID"}'::jsonb
WHERE id = 'EMPLOYEE_ID';
```

### 2. "Failed to create session"

**Causes:**
- Wrong API key
- API key from different org than Agent Builder
- Invalid workflow_id
- Workflow deleted in Agent Builder

**Fix:**
1. Check API key in Netlify
2. Verify workflow exists in Agent Builder
3. Check Netlify function logs

### 3. ChatKit script won't load

**Fix:** Add to `index.html`:
```html
<script src="https://cdn.openai.com/chatkit/v1/chatkit.js" type="module"></script>
```

### 4. Session expires quickly

**Normal behavior** - Sessions expire after inactivity. The component will auto-reconnect.

---

## 📊 Workflow Mapping Examples

### Simple Mapping
```sql
-- One workflow for everyone
UPDATE purchased_employees
SET metadata = '{"workflow_id": "flow_general_001"}'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

### Role-Based Mapping
```sql
-- Different workflow per role
UPDATE purchased_employees
SET metadata = CASE
  WHEN role = 'Data Analyst' THEN '{"workflow_id": "flow_data_001"}'::jsonb
  WHEN role = 'Content Writer' THEN '{"workflow_id": "flow_content_001"}'::jsonb
  ELSE '{"workflow_id": "flow_general_001"}'::jsonb
END
WHERE user_id = 'YOUR_USER_ID';
```

### Employee-Specific Mapping
```sql
-- Unique workflow per employee
UPDATE purchased_employees
SET metadata = '{"workflow_id": "flow_custom_jane_001"}'::jsonb
WHERE id = 'SPECIFIC_EMPLOYEE_ID';
```

---

## 🔗 Helpful Links

- **Agent Builder**: https://platform.openai.com/agent-builder
- **API Keys**: https://platform.openai.com/api-keys
- **ChatKit GitHub**: https://github.com/openai/openai-chatkit-starter-app
- **Full Guide**: `CHATKIT_INTEGRATION_GUIDE.md`
- **SQL Script**: `supabase/add_workflow_ids.sql`

---

## 💡 Tips

1. **Start Simple**: Use one workflow for testing
2. **Test Workflows**: Test in Agent Builder before deploying
3. **Monitor Usage**: ChatKit counts toward your OpenAI quota
4. **Be Descriptive**: Name workflows clearly for easy management
5. **Version Control**: Use numbers (flow_name_001, flow_name_002)

---

## 🎊 You're All Set!

Your `/chat-agent` page now uses ChatKit!

**What You Get:**
- ✨ Clean, professional chat UI
- 🎨 Automatic theme switching
- 🚀 Fast, reliable from OpenAI
- 📦 Less code to maintain
- 💪 Production-ready

---

**Need Help?**
- Check `CHATKIT_INTEGRATION_GUIDE.md` for detailed docs
- Review `supabase/add_workflow_ids.sql` for SQL examples
- Check browser console for errors
- Review Netlify function logs

---

**Happy Chatting! 🎉**

