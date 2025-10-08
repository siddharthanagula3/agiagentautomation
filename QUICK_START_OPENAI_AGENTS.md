# 🚀 Quick Start: OpenAI Agents SDK

## ⚡ Get Started in 3 Steps

### Step 1: Set Your OpenAI API Key

Add your OpenAI API key to your environment variables:

**For Local Development:**
Create or update `.env.local`:
```bash
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

**For Production (Netlify):**
```bash
# Go to Netlify Dashboard → Site Settings → Environment Variables
# Add:
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### Step 2: Apply Database Migration

Run the agent sessions migration in your Supabase project:

**Option A: Using Supabase CLI**
```bash
supabase db push
```

**Option B: Manual SQL**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20241210_agent_sessions.sql`
4. Click "Run"

### Step 3: Start the App

**Local Development:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run preview
```

## 🎯 Using the Agent Chat

### Access the Interface

1. **Navigate to Workforce Page**
   - URL: `http://localhost:5173/workforce` (or your production URL)
   - Or click "Workforce" in the main navigation

2. **Select an AI Employee**
   - Browse your purchased AI employees
   - Click the "Chat" button on any employee card

3. **Start Chatting**
   - You'll be redirected to `/chat-agent/:employeeId`
   - The agent interface will load with OpenAI styling
   - Start typing your message in the chat input

### Interface Overview

#### Left Sidebar - Agent Configuration
- **Model Selection**: Choose GPT-4o, GPT-4, or GPT-3.5 Turbo
- **Tools**: Enable/disable tools like Web Search, Code Interpreter
- **Instructions**: Set custom developer instructions
- **Settings**: Adjust temperature and max tokens
- **Save/Draft**: Save your agent configuration

#### Right Side - Chat Interface
- **Message History**: See all conversation messages
- **Streaming Responses**: Watch responses appear in real-time
- **Tool Execution**: See when tools are being used
- **Message Controls**: Copy, regenerate, or stop messages
- **Code Highlighting**: Automatically highlights code blocks

## 🔧 Configuration Options

### Agent Settings

**Temperature** (0.0 - 2.0)
- `0.0`: Deterministic, focused responses
- `0.7`: Balanced (default)
- `2.0`: Creative, varied responses

**Max Tokens** (100 - 4000+)
- Controls response length
- Default: 4000 tokens
- Higher = longer responses

**Tools Available**
- ✅ Web Search - Search the internet
- ✅ Code Interpreter - Execute code
- ✅ Data Analysis - Analyze data
- ✅ File Operations - Read/write files

## 💡 Example Use Cases

### 1. Code Generation
```
User: "Create a React component for a user profile card"
Agent: [Uses Code Interpreter]
       [Returns complete component code with styling]
```

### 2. Research
```
User: "What are the latest trends in AI for 2024?"
Agent: [Uses Web Search]
       [Returns comprehensive research summary]
```

### 3. Data Analysis
```
User: "Analyze this sales data and find patterns"
Agent: [Uses Data Analysis tool]
       [Returns insights and visualizations]
```

## 🎨 Customization

### Change Agent Appearance
Edit `src/pages/chat/ChatAgentPage.tsx`:
```typescript
// Line ~100-150: Modify UI components
// Change colors, layout, or add custom features
```

### Add Custom Tools
Edit `src/services/openai-agents-service.ts`:
```typescript
// Line ~140-200: Add new tool definitions
// Define parameters, execute functions
```

### Modify Agent Instructions
The instructions are auto-generated from employee data, but you can customize:
```typescript
// Line ~95-115: generateInstructions method
// Add custom prompts or guidelines
```

## 📊 Monitoring

### Track Token Usage
- Messages are stored in the database
- Check `agent_messages` table for history
- Monitor OpenAI dashboard for API usage

### View Sessions
```sql
-- Check all active sessions
SELECT * FROM agent_sessions 
WHERE ended_at IS NULL;

-- View conversation history
SELECT * FROM agent_messages 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at;
```

## 🐛 Troubleshooting

### Issue: "Session not found"
**Solution**: The session may have expired. Refresh the page to start a new session.

### Issue: No response from agent
**Solutions**:
1. Check your OpenAI API key is set correctly
2. Verify you have credits in your OpenAI account
3. Check browser console for errors
4. Verify network connectivity

### Issue: Database errors
**Solutions**:
1. Ensure migration was applied: `supabase db push`
2. Check RLS policies are enabled
3. Verify user is authenticated

### Issue: Tools not working
**Solutions**:
1. Check tool executors in `openai-agents-service.ts`
2. Verify tool parameters match schema
3. Check browser console for tool execution errors

## 🔐 Security Best Practices

### API Keys
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ❌ Don't hardcode keys in source

### Database Access
- ✅ RLS policies are enabled
- ✅ Users can only see their own data
- ✅ Authenticated access required
- ❌ Don't disable RLS in production

### Rate Limiting
- Consider implementing rate limits for API calls
- Monitor OpenAI usage to prevent abuse
- Set spending limits in OpenAI dashboard

## 📱 Mobile Support

The interface is fully responsive and works on:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024+)
- ✅ Mobile (375x667+)

## 🚀 Performance Tips

### 1. Use Streaming
- Already implemented by default
- Reduces perceived latency
- Better user experience

### 2. Cache Sessions
- Sessions are cached in memory
- Reduces database queries
- Faster response times

### 3. Optimize Tools
- Only enable needed tools
- Reduce tool complexity
- Cache tool results when possible

## 📚 Additional Resources

### OpenAI Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4 Guide](https://platform.openai.com/docs/guides/gpt)
- [Function Calling](https://platform.openai.com/docs/guides/function-calling)

### Our Documentation
- `OPENAI_AGENTS_ACTIVATION_COMPLETE.md` - Full implementation details
- `OPENAI_AGENTS_IMPLEMENTATION.md` - Technical overview
- `src/services/openai-agents-service.ts` - Service layer code

## 🎉 You're All Set!

The OpenAI Agents SDK is now fully activated and ready to use. Start chatting with your AI employees and explore the advanced agent capabilities!

### Test Checklist
- [ ] Set OpenAI API key
- [ ] Run database migration
- [ ] Start the development server
- [ ] Navigate to /workforce
- [ ] Click "Chat" on an employee
- [ ] Send a test message
- [ ] See streaming response
- [ ] Try different tools
- [ ] Check message history

**Happy Building! 🚀**

