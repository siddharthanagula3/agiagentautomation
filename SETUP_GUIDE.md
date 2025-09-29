# 🚀 AGI Platform - Complete Setup Guide

## ✅ Current Status

Your AGI Platform is fully configured with:
- ✅ **All routes at root level** (clean URLs)
- ✅ **Real data only** (no mock data)
- ✅ **Full authentication** (Supabase)
- ✅ **Chat with AI** (OpenAI, Claude, Gemini, Perplexity)
- ✅ **Help & Support page**
- ✅ **Billing page**
- ✅ **Settings (all working)**

---

## 🌐 URL Structure

### Main Features (Root Level)
```
/                    Landing page
/dashboard           Dashboard home
/workforce           AI workforce management
/chat                Real-time AI chat
/automation          Workflow automation
/analytics           Performance analytics
/integrations        External integrations
/marketplace         Hire AI employees
```

### Account & System (Root Level)
```
/settings            All settings (Profile, Notifications, Security, System)
/billing             Subscription & billing
/api-keys            API key management
/support             Help & support center
```

---

## 🔑 API Keys Setup

### Required for Chat Functionality

Add these to your `.env` file:

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=https://lywdzvfibhzbljrgovwr.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here

# AI Providers (Add at least one)
VITE_OPENAI_API_KEY=sk-proj-...          # OpenAI/ChatGPT
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude
VITE_GOOGLE_API_KEY=AIzaSy...            # Gemini (FREE!)
VITE_PERPLEXITY_API_KEY=pplx-...         # Perplexity
```

### Where to Get API Keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google Gemini**: https://aistudio.google.com/app/apikey (FREE!)
- **Perplexity**: https://www.perplexity.ai/settings/api

See `API_SETUP_GUIDE.md` for detailed instructions.

---

## 🗄️ Supabase Setup

### Database Tables Created:
- ✅ `purchased_employees` - Track hired AI employees
- ✅ `chat_sessions` - Chat conversation sessions
- ✅ `chat_messages` - Individual chat messages
- ✅ `settings` - User settings
- ✅ `billing` - Billing information
- ✅ `usage_tracking` - API usage tracking

See `SUPABASE_SETUP_GUIDE.md` for SQL schemas.

---

## 🎯 How to Use

### 1. Start Development Server
```bash
npm run dev
```

### 2. First-Time Setup
1. Visit http://localhost:5173
2. Click "Get Started" → Register
3. Verify email (check Supabase auth)
4. Login to dashboard

### 3. Hire AI Employees
1. Go to `/marketplace`
2. Browse 20 AI employees
3. Click "Hire Now" ($1 each)
4. Employees added to your team

### 4. Start Chatting
1. Go to `/chat`
2. Click "New Chat" button
3. Select hired employee
4. Start conversation!

### 5. Create Workflows
1. Go to `/automation`
2. Click "Create Workflow"
3. Use visual designer
4. Save and execute

---

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/      Dashboard components
│   ├── layout/         Sidebar, header, layout
│   ├── ui/             Shadcn UI components
│   └── chat/           Chat interface
├── pages/
│   ├── auth/           Login, register
│   ├── chat/           Chat page
│   ├── dashboard/      Billing, API keys, support
│   ├── settings/       Settings page
│   ├── workforce/      Workforce management
│   ├── automation/     Automation pages
│   └── analytics/      Analytics pages
├── services/
│   ├── ai-chat-service.ts      AI provider integration
│   ├── supabase-*.ts           Supabase services
│   └── settingsService.ts      Settings management
├── stores/
│   └── unified-auth-store.ts   Authentication state
└── App.tsx                      Main routing
```

---

## 🛠️ Features

### ✅ Authentication
- Email/password registration
- Email verification
- Session management
- Protected routes

### ✅ AI Chat
- Multi-provider support (OpenAI, Claude, Gemini, Perplexity)
- Multi-tab interface
- Message history
- File attachments
- Voice recording
- Real-time responses

### ✅ Marketplace
- 20 AI employees available
- $1 per employee
- Search & filters
- Instant hiring
- Purchase tracking

### ✅ Settings
- **Profile**: Name, email, bio, timezone
- **Notifications**: Email, push, alerts (all toggles work)
- **Security**: 2FA, session timeout, password
- **System**: Theme, auto-save, debug mode

### ✅ Billing
- Current plan display
- Usage tracking (tokens, cost)
- Plan features
- Upgrade options
- Invoice history

### ✅ Help & Support
- 15+ FAQs (organized by category)
- Search functionality
- Contact form
- Documentation links
- Support channels

---

## 🐛 Troubleshooting

### Issue: "useAuthStore is not defined"
**Solution**: Clear browser cache (Ctrl+Shift+R) and refresh

### Issue: Chat not working
**Solution**: Check API keys are in `.env` and restart server

### Issue: Blank page after login
**Solution**: Check browser console for errors, verify Supabase connection

### Issue: 404 on routes
**Solution**: Refresh page or restart dev server

---

## 🚀 Deployment

### For Netlify:
1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

### Environment Variables for Production:
All `VITE_*` variables from `.env` must be added to Netlify's environment variables section.

---

## 📚 Additional Documentation

- **API Setup**: See `API_SETUP_GUIDE.md`
- **Supabase**: See `SUPABASE_SETUP_GUIDE.md`
- **Main README**: See `README.md`

---

## ✨ What's New in Latest Update

### Route Restructure
- **All routes now at root level** for cleaner URLs
- `/chat` instead of `/dashboard/chat`
- `/settings` instead of `/dashboard/settings`
- `/billing` instead of `/dashboard/billing`

### Improvements
- Removed all temporary documentation files
- Cleaned up codebase
- Fixed all navigation links
- Optimized routing structure

---

## 🎉 You're Ready!

Your AGI Platform is production-ready with:
- Clean URL structure
- Real data integration
- Full authentication
- AI chat functionality
- Billing & settings
- Help & support

**Start building your AI workforce!** 🚀

---

## 📞 Support

If you need help:
1. Check this guide
2. Visit `/support` in the app
3. Check browser console for errors
4. Verify environment variables
5. Restart development server

**Happy building!** 😊
