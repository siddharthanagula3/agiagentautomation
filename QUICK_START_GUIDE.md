# 🚀 Quick Start - Free AI Employee Hiring

## Current Status
✅ Code deployed to production  
✅ Marketplace shows attractive pricing (~~$20/mo~~ → **$0**)  
⚠️ **Need to run SQL script** to enable hiring  

---

## 🔥 Do This Now (2 minutes)

### Step 1: Run SQL in Supabase
1. Open: https://supabase.com/dashboard
2. Select project: `agiagentautomation`
3. Click **SQL Editor** → **New Query**
4. Copy & paste from `SETUP_FREE_HIRING.sql` (or below)
5. Click **Run** (F5)

### Step 2: Test Hiring
1. Go to your marketplace: https://agiagentautomation.com/marketplace
2. Click **"Hire Now - Free!"** on any employee
3. Should see: ✅ Success toast
4. Go to `/workforce` - employee should appear
5. Click **"Build with AI"** - start chatting

---

## The SQL Script (Copy This)

```sql
DROP TABLE IF EXISTS public.purchased_employees CASCADE;

CREATE TABLE public.purchased_employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT true,
    purchased_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, employee_id)
);

CREATE INDEX idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;

ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hired employees"
    ON public.purchased_employees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can hire employees (insert)"
    ON public.purchased_employees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hired employees"
    ON public.purchased_employees FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hired employees"
    ON public.purchased_employees FOR DELETE
    USING (auth.uid() = user_id);

GRANT ALL ON public.purchased_employees TO authenticated;
GRANT ALL ON public.purchased_employees TO service_role;
```

---

## What's Live

### Marketplace Features
- ✅ **Limited Time Offer** badge (animated)
- ✅ Strikethrough pricing: ~~$20/mo~~ → **$0**
- ✅ "Introductory offer for early adopters"
- ✅ "Hire Now - Free!" button with ⚡ icon

### Revenue Model
- **Free Tier**: All employees free, 1M tokens (250k/LLM)
- **Pro Plan**: $20/mo, 10M tokens (2.5M/LLM)
- **Max Plan**: $299/mo, 40M tokens (10M/LLM)

### How It Works
1. User clicks "Hire Now - Free!"
2. Employee instantly added to their workforce
3. No payment, no checkout, no waiting
4. Start building immediately in `/vibe`

---

## Troubleshooting

### "Failed to hire employee"
→ Run the SQL script above in Supabase Dashboard

### Employee doesn't appear in workforce
→ Check browser console for errors  
→ Verify you're logged in  
→ Refresh the page

### SQL script fails
→ Use Supabase **Web Dashboard**, not CLI  
→ CLI has a known bug on Windows  
→ Web dashboard works perfectly

---

## Files Reference

- `SETUP_FREE_HIRING.sql` - Complete SQL script
- `RUN_THIS_IN_SUPABASE_NOW.md` - Detailed instructions
- `FREE_HIRING_SUMMARY.md` - Implementation details
- `DEPLOYMENT_COMPLETE.md` - Deployment checklist

---

**Status**: Ready to go! Just run the SQL script and start hiring. 🎉

