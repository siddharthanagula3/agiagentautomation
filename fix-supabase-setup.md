# 🔧 Fix Supabase Setup - Complete Solution

## 🎯 **Root Cause Identified**
The infinite loading issue is caused by **invalid Supabase API keys**. The current keys in the environment are not working.

## 🚀 **Complete Solution**

### 1. **Get Fresh Supabase Keys**
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `lywdzvfibhzbljrgovwr`
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### 2. **Update Environment Variables**
Replace the values in your `.env` file:

```env
# Get these from your Supabase dashboard
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-fresh-anon-key-here

# Stripe Configuration (already correct)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RxgnG21oG095Q15c8WuKzv4x9Qn5t6bGPIctx5hGD1UrOe5t0aR4lj0qn7JRJdrvt2LKUUpBp2LLIKMldegwbxh004Oft02rx

# JWT Secret (generate a secure random string)
VITE_JWT_SECRET=your-jwt-secret-key-here
```

### 3. **Run SQL Scripts in Supabase**
Execute this SQL in your Supabase SQL Editor:

```sql
-- Fix RLS Policies for Users Table
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can insert users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can delete users" ON public.users;
    DROP POLICY IF EXISTS "System can create user profiles" ON public.users;
    
    -- Drop mcp_tools table policies
    DROP POLICY IF EXISTS "Authenticated users can view mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can insert mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can update mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can delete mcp_tools" ON public.mcp_tools;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Create users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to create profiles for authenticated users
CREATE POLICY "System can create user profiles" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow viewing other users (for admin purposes)
CREATE POLICY "Authenticated users can view users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create mcp_tools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mcp_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mcp_tools
ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;

-- Create mcp_tools policies
CREATE POLICY "Authenticated users can view mcp_tools" ON public.mcp_tools
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert mcp_tools" ON public.mcp_tools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update mcp_tools" ON public.mcp_tools
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete mcp_tools" ON public.mcp_tools
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample MCP tools
INSERT INTO public.mcp_tools (name, description, category, is_active) VALUES
('File Manager', 'Manage files and directories', 'system', true),
('Database Query', 'Execute database queries', 'data', true),
('API Client', 'Make HTTP requests to external APIs', 'integration', true),
('Email Sender', 'Send emails programmatically', 'communication', true),
('Image Processor', 'Process and manipulate images', 'media', true)
ON CONFLICT (id) DO NOTHING;
```

### 4. **Test the Fix**
After updating the environment variables and running the SQL:

```bash
# Test the connection
node test-supabase-keys.js

# Start the development server
npm run dev
```

### 5. **Simple CI/CD Pipeline**
The simple CI/CD pipeline is already set up in `.github/workflows/simple-deploy.yml`:

- ✅ **Automatic deployment** on push to main/master
- ✅ **Environment variables** from GitHub Secrets
- ✅ **Build and deploy** to Netlify
- ✅ **Simple and reliable**

### 6. **GitHub Secrets Setup**
In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**, and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

## 🎯 **Expected Result**
After completing these steps:
1. ✅ Environment variables will be valid
2. ✅ Supabase connection will work
3. ✅ Login will work without infinite loading
4. ✅ Automatic deployment will work
5. ✅ All dashboard pages will load properly

## 🚀 **Next Steps**
1. Update your Supabase keys
2. Run the SQL scripts
3. Test locally with `npm run dev`
4. Push to GitHub for automatic deployment
