# Tool Integration System - Testing Guide

## Quick Start Testing

### Prerequisites

1. **Set up environment variables:**

```bash
# Required for image/video generation
VITE_GOOGLE_API_KEY=your_google_api_key

# Optional for enhanced search
VITE_PERPLEXITY_API_KEY=your_perplexity_key
VITE_GOOGLE_CX=your_google_custom_search_id

# Or enable demo mode (no API keys needed)
VITE_DEMO_MODE=true
```

2. **Start the development server:**

```bash
npm run dev
```

3. **Navigate to `/chat` page**

## Test Cases

### Test 1: Image Generation ✨

**Input:**

```
Generate a realistic image of a sunset over mountains
```

**Expected Behavior:**

1. Shows "🔄 Analyzing your request and selecting tools..."
2. Tool progress indicator appears with "Image Generation"
3. Image appears in chat with download/copy buttons
4. No LLM response (tool handled everything)

**Advanced Test:**

```
Create a photographic quality image of a cat in 16:9 aspect ratio
```

**Verify:**

- Aspect ratio is correctly parsed (16:9)
- Quality setting is "hd"
- Image displays properly

---

### Test 2: Video Generation 🎬

**Input:**

```
Generate a 10 second cinematic video of ocean waves
```

**Expected Behavior:**

1. Tool progress indicator shows "Video Generation"
2. Progress bar updates (0% → 100%)
3. Video player appears with controls
4. Duration is 10 seconds
5. Download/copy URL buttons work

**Advanced Test:**

```
Create a 15 second video of a forest in 1080p high definition
```

**Verify:**

- Duration is 15 seconds
- Resolution is 1080p
- Video plays smoothly

---

### Test 3: Document Creation 📄

**Input:**

```
Create a comprehensive report on AI safety with sections on ethics, risks, and regulations
```

**Expected Behavior:**

1. Tool processes document creation
2. Markdown document appears with proper formatting
3. Export .md button appears
4. Document has clear sections (ethics, risks, regulations)
5. No additional LLM response

**Advanced Test:**

```
Write a technical documentation for a REST API with examples and best practices
```

**Verify:**

- Document type is "documentation"
- Technical tone is used
- Code examples are included

---

### Test 4: Web Search 🔍

**Input:**

```
What are the latest developments in quantum computing this week?
```

**Expected Behavior:**

1. Shows "Searching the web..."
2. Search results appear with citations
3. AI synthesizes results into comprehensive answer
4. Source URLs are clickable

**Advanced Test:**

```
Search for current AI news and summarize the top trends
```

**Verify:**

- Recent/current results are shown
- AI summary references sources
- Citations use [1], [2] format

---

### Test 5: Multi-Tool Request 🔗

**Input:**

```
Search for the latest AI art trends and generate an image based on what you find
```

**Expected Behavior:**

1. Tool progress shows both "Web Search" and "Image Generation"
2. Search results appear first
3. Generated image appears second
4. AI provides contextual explanation

**Advanced Test:**

```
Find information about cyberpunk aesthetics and create a cyberpunk-style image
```

**Verify:**

- Search informs image prompt
- Both results display properly
- LLM ties them together

---

### Test 6: Code Generation (Suggestion) 💻

**Input:**

```
Write a React component for a user profile card with avatar and bio
```

**Expected Behavior:**

1. Toast notification: "For better code generation experience, try /vibe"
2. Chat still generates code with syntax highlighting
3. Toast has "Go to Vibe" action button

**Verify:**

- Suggestion appears
- Code is still generated
- User can click to navigate to /vibe

---

### Test 7: Complex Multi-Agent Task 🤝

**Input:**

```
Build a complete authentication system with frontend forms, backend API, database schema, and security best practices
```

**Expected Behavior:**

1. Tool detects complexity
2. Toast: "For complex multi-step tasks, try Mission Control"
3. Multiple AI employees collaborate
4. Collaboration messages show employee discussions
5. Final synthesis provides comprehensive answer

**Verify:**

- Multiple employees involved
- Collaboration badges show
- Supervisor synthesis appears
- Suggestion toast appears

---

### Test 8: General Chat (Fallback) 💬

**Input:**

```
How are you doing today?
```

**Expected Behavior:**

1. No special tools detected
2. Goes straight to LLM
3. Normal chat response

**Verify:**

- No tool progress indicator
- Immediate response
- Conversational reply

---

## Edge Cases

### Test E1: Invalid Tool Request

**Input:**

```
Generate a video of something impossible
```

**Expected:**

- Tool attempts execution
- Error toast appears
- Falls back to LLM response

### Test E2: No API Keys

**Input:**

```
Generate an image
```

**Without VITE_GOOGLE_API_KEY:**

- Clear error message
- Instructions to get API key
- Link to Google AI Studio

### Test E3: Network Failure

**Expected:**

- Graceful error handling
- User-friendly error message
- Retry suggestion

---

## Performance Benchmarks

### Expected Timings:

- Image generation: 3-8 seconds
- Video generation: 30-120 seconds
- Document creation: 5-15 seconds
- Web search: 1-3 seconds
- Multi-agent: 10-30 seconds

### Tool Progress Updates:

- Should update every 0.5-1 seconds
- Progress bars should be smooth
- No UI freezing during execution

---

## UI/UX Checks

### Visual Elements:

- ✅ Tool progress indicator appears
- ✅ Progress bars animate smoothly
- ✅ Tool icons display correctly
- ✅ Generated images are high quality
- ✅ Video player has controls
- ✅ Download buttons work
- ✅ Copy URL buttons work
- ✅ Toast notifications appear
- ✅ Error messages are clear

### Accessibility:

- ✅ Keyboard navigation works
- ✅ Screen reader friendly
- ✅ High contrast mode supported
- ✅ Focus indicators visible

---

## Browser Compatibility

Test in:

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## Debugging Tips

### Enable Debug Logging:

1. **Open browser console** (F12)
2. **Look for [ToolRouter] logs:**

```
[ToolRouter] Execution completed in 4532ms {
  detectedTools: ['image-generation'],
  executedTools: 1,
  successful: 1
}
```

3. **Check for errors:**

```
[Chat] Tool router error: ...
```

### Common Issues:

**Issue: Tool not detected**

- Check keyword matching
- Try more explicit request
- Check console for detection result

**Issue: Tool execution fails**

- Verify API keys in .env
- Check network connection
- Look for error in toast

**Issue: Progress not updating**

- Check browser console
- Verify React DevTools
- Look for state updates

---

## Success Criteria

✅ All 8 test cases pass
✅ Edge cases handled gracefully
✅ Performance meets benchmarks
✅ UI/UX elements work correctly
✅ No console errors
✅ Type checking passes
✅ Build succeeds
✅ Mobile responsive

---

## Reporting Issues

If you encounter issues:

1. **Capture:**
   - Screenshot of UI
   - Console logs
   - Network tab (if API related)
   - Error messages

2. **Document:**
   - User input
   - Expected behavior
   - Actual behavior
   - Browser/OS

3. **Check:**
   - Environment variables
   - API key validity
   - Network connectivity
   - Browser compatibility

---

## Next Steps

After testing:

1. ✅ Verify all tools work
2. ✅ Test error scenarios
3. ✅ Check mobile responsiveness
4. ✅ Review performance
5. ✅ Deploy to staging
6. ✅ User acceptance testing
7. ✅ Production deployment

---

Happy testing! 🚀
