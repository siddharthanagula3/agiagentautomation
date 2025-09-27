# Netlify Environment Variables Setup

## Required Environment Variables

Set these environment variables in your Netlify dashboard:

### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Stripe Configuration
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

### JWT Secret
```
VITE_JWT_SECRET=your_jwt_secret_here
```

### Optional: Additional API Keys
```
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_N8N_API_KEY=your_n8n_key_here
```

## How to Set Environment Variables in Netlify

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Go to Site settings > Environment variables**
4. **Click "Add variable"**
5. **Add each variable with its value**
6. **Click "Save"**

## Important Notes

- ✅ All code uses `import.meta.env.VITE_*` (correct for Vite/Netlify)
- ✅ No hardcoded secrets in source code
- ✅ Environment variables will be available at build time
- ✅ Netlify will inject these variables during the build process

## Verification

After setting the environment variables:
1. **Trigger a new build** in Netlify
2. **Check the build logs** for any missing variables
3. **Test your application** to ensure everything works

## Security

- 🔒 Never commit `.env` files with real secrets
- 🔒 Use Netlify's environment variables for production
- 🔒 Keep your local `.env` file with placeholder values only
