# Netlify Environment Variables Setup (Production Only)

## 🎯 **Goal: Set Environment Variables ONLY in Netlify**

You're right - for production, you only need the environment variables in Netlify, not locally.

## 🔧 **Step-by-Step Netlify Setup:**

### **1. Go to Netlify Dashboard:**
- Visit [netlify.com](https://netlify.com)
- Sign in to your account
- Select your site

### **2. Navigate to Environment Variables:**
- Click **"Site Settings"** (gear icon)
- Click **"Environment Variables"** in the left sidebar
- Click **"Add variable"**

### **3. Add These Variables One by One:**

#### **Variable 1: Supabase URL**
```
Variable Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co
```

#### **Variable 2: Supabase Anon Key**
```
Variable Name: VITE_SUPABASE_ANON_KEY
Value: your-anon-public-key-here
```

#### **Variable 3: Stripe Publishable Key**
```
Variable Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_stripe_key_here
```

#### **Variable 4: JWT Secret**
```
Variable Name: VITE_JWT_SECRET
Value: your-jwt-secret-here
```

### **4. Get Your Supabase Credentials:**

#### **From Supabase Dashboard:**
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ`)

### **5. Generate JWT Secret:**
```bash
# Run this command to generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **6. Save and Deploy:**
- Click **"Save"** for each variable
- Go to **"Deploys"** tab
- Click **"Trigger deploy"** → **"Deploy site"**

## ✅ **Expected Results:**
- ✅ **No more "Invalid API key" error**
- ✅ **Login will work properly**
- ✅ **Supabase connection established**
- ✅ **All features functional**

## 🔍 **Important Notes:**
- ❌ **Don't create `.env` file locally** (you're right!)
- ✅ **Only set variables in Netlify**
- ✅ **Variables will be available during build**
- ✅ **No local environment needed**

## 📋 **After Setup:**
1. **Wait for deploy to complete** (2-3 minutes)
2. **Test your login page**
3. **Verify Supabase connection works**
4. **All features should be functional**

**Your app will work perfectly with Netlify environment variables only!** 🎉
