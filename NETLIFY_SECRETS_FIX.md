# Netlify Secrets Scanning Fix

## 🚨 **CRITICAL: Remove These from Netlify Environment Variables**

### **Environment Variables to REMOVE from Netlify:**
```
❌ STRIPE_SECRET_KEY
❌ VITE_JWT_SECRET  
❌ VITE_STRIPE_PUBLISHABLE_KEY
❌ VITE_SUPABASE_ANON_KEY
❌ VITE_SUPABASE_URL
❌ NODE_VERSION
❌ NODE_OPTIONS
❌ SECRETS_SCAN_OMIT_KEYS
```

### **Environment Variables to KEEP in Netlify:**
```
✅ VITE_SUPABASE_URL=your_actual_supabase_url
✅ VITE_SUPABASE_ANON_KEY=your_actual_supabase_key
✅ VITE_STRIPE_PUBLISHABLE_KEY=your_actual_stripe_key
✅ VITE_JWT_SECRET=your_actual_jwt_secret
```

## 🔧 **Step-by-Step Fix:**

### **1. Go to Netlify Dashboard:**
- **Site Settings** → **Environment Variables**
- **Delete ALL the variables listed above**
- **Keep only the VITE_* variables with real values**

### **2. Update netlify.toml:**
The `netlify.toml` file should NOT contain any secret values, only configuration.

### **3. Verify Build Environment:**
- **No hardcoded secrets** in source code ✅
- **Only VITE_* variables** in Netlify environment ✅
- **No sensitive data** in build output ✅

## 🎯 **Expected Result:**
- ✅ **No secrets scanning errors**
- ✅ **Clean build process**
- ✅ **Secure deployment**

## 📋 **Quick Checklist:**
- [ ] Remove STRIPE_SECRET_KEY from Netlify env vars
- [ ] Remove VITE_JWT_SECRET from Netlify env vars  
- [ ] Remove VITE_STRIPE_PUBLISHABLE_KEY from Netlify env vars
- [ ] Remove VITE_SUPABASE_ANON_KEY from Netlify env vars
- [ ] Remove VITE_SUPABASE_URL from Netlify env vars
- [ ] Remove NODE_VERSION from Netlify env vars
- [ ] Remove NODE_OPTIONS from Netlify env vars
- [ ] Remove SECRETS_SCAN_OMIT_KEYS from Netlify env vars
- [ ] Add back only VITE_* variables with real values
- [ ] Trigger new build

**The issue is in Netlify's environment variables, not the code!** 🎯
