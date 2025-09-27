# Netlify Environment Variables Setup Guide

## 🚨 **Current Issue: "Invalid API key" Error**

The login page is showing "Invalid API key" because the Supabase environment variables are not properly configured in Netlify.

## 🔧 **Step-by-Step Fix:**

### **1. Go to Netlify Dashboard:**
- Visit [netlify.com](https://netlify.com)
- Sign in to your account
- Select your site

### **2. Navigate to Environment Variables:**
- Go to **Site Settings** → **Environment Variables**
- Click **"Add variable"**

### **3. Add These Variables:**

#### **Supabase Configuration:**
```
Variable Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co
```

```
Variable Name: VITE_SUPABASE_ANON_KEY  
Value: your-anon-public-key-here
```

#### **Stripe Configuration:**
```
Variable Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_stripe_key_here
```

#### **JWT Secret:**
```
Variable Name: VITE_JWT_SECRET
Value: your-jwt-secret-here
```

### **4. Get Your Supabase Keys:**

#### **From Supabase Dashboard:**
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`

### **5. Generate JWT Secret:**
```bash
# Run this in your terminal to generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **6. Save and Deploy:**
- Click **"Save"** for each variable
- Go to **Deploys** tab
- Click **"Trigger deploy"** → **"Deploy site"**

## ✅ **Expected Results:**
- ✅ **No more "Invalid API key" error**
- ✅ **Login will work properly**
- ✅ **Supabase connection established**
- ✅ **All features functional**

## 🔍 **Troubleshooting:**

### **If you still get errors:**
1. **Check variable names** - must be exactly `VITE_SUPABASE_URL` etc.
2. **Check values** - no extra spaces or quotes
3. **Wait for deploy** - changes take a few minutes
4. **Clear browser cache** - hard refresh the page

### **Common Mistakes:**
- ❌ Using `SUPABASE_URL` instead of `VITE_SUPABASE_URL`
- ❌ Adding quotes around the values
- ❌ Using the wrong key (service key instead of anon key)
- ❌ Forgetting to save the variables

## 📞 **Need Help?**
If you're still having issues, check:
1. **Supabase project is active**
2. **Keys are correct**
3. **Variables are saved in Netlify**
4. **Deploy completed successfully**
