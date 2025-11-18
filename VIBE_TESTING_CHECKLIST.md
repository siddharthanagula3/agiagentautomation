# Vibe Dashboard - Testing Checklist

## Pre-Deployment Checklist

### Build & Compilation

- [x] TypeScript compilation passes (`npm run type-check`)
- [x] ESLint passes with no errors (`npm run lint`)
- [x] Production build succeeds (`npm run build`)
- [x] No console errors during build
- [x] Bundle size is acceptable (700KB / 249KB gzipped)

### Component Testing

#### SimpleChatPanel

- [ ] Messages display correctly (user and agent)
- [ ] Avatar colors are correct (blue for user, purple for agent)
- [ ] Agent name and role badges show up
- [ ] Markdown rendering works (bold, italic, links)
- [ ] Code blocks have syntax highlighting
- [ ] Auto-scroll to bottom on new messages
- [ ] Empty state shows when no messages
- [ ] Streaming indicator appears during streaming
- [ ] Timestamps display correctly

#### CodeEditorPanel

- [ ] Monaco Editor loads without errors
- [ ] File tree displays when files exist
- [ ] File tree is collapsible (show/hide button works)
- [ ] Clicking files opens them in editor
- [ ] File tabs show open files
- [ ] Switching between tabs works
- [ ] Closing tabs works (X button)
- [ ] Syntax highlighting works for different languages
- [ ] Copy code button works
- [ ] Download button works
- [ ] Empty state shows when no file selected
- [ ] File tree scrolls when many files
- [ ] Editor is editable (can type)
- [ ] Line numbers display
- [ ] Minimap shows on the right

#### LivePreviewPanel

- [ ] Preview iframe loads correctly
- [ ] URL input accepts and loads URLs
- [ ] Refresh button reloads iframe
- [ ] Open external button opens in new tab
- [ ] Desktop viewport shows full size
- [ ] Tablet viewport shows 768×1024
- [ ] Mobile viewport shows 375×667
- [ ] Console panel toggles on/off
- [ ] Console messages display with correct colors
- [ ] Console clear button works
- [ ] Empty state shows when no URL
- [ ] Loading indicator shows while loading
- [ ] Iframe sandbox is secure (check DevTools)

### Layout Testing

#### Desktop (≥768px)

- [ ] Three panels visible simultaneously
- [ ] Left panel (chat) is ~30% width
- [ ] Right panel is ~70% width
- [ ] Code editor is ~60% of right panel height
- [ ] Preview is ~40% of right panel height
- [ ] Horizontal resize handle works (left/right)
- [ ] Vertical resize handle works (up/down)
- [ ] Resize handles show on hover
- [ ] Panels snap to min/max sizes
- [ ] Layout persists after refresh (optional)

#### Mobile (<768px)

- [ ] Panels stack vertically
- [ ] Each panel is equal height (33%)
- [ ] Chat is on top
- [ ] Code editor in middle
- [ ] Preview on bottom
- [ ] All panels scroll independently
- [ ] No horizontal scroll
- [ ] Touch gestures work

### Integration Testing

#### Message Flow

- [ ] User can send messages
- [ ] Messages appear in chat panel
- [ ] Agent responses stream correctly
- [ ] Messages persist to database
- [ ] Messages load on page refresh
- [ ] Real-time updates work (Supabase subscription)

#### File Operations

- [ ] Files created by agent appear in tree
- [ ] File content displays in editor
- [ ] File content updates in real-time
- [ ] Multiple files can be open
- [ ] File metadata is preserved

#### Agent Orchestration

- [ ] Workforce orchestrator still works
- [ ] Agent selection logic intact
- [ ] Task execution runs correctly
- [ ] Working steps update (if visible)
- [ ] Error handling works

### Browser Compatibility

#### Desktop Browsers

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Opera (latest)

#### Mobile Browsers

- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Performance Testing

#### Load Time

- [ ] Initial page load < 3 seconds
- [ ] Monaco Editor loads < 2 seconds
- [ ] Chat messages render < 100ms
- [ ] File tree renders < 500ms

#### Runtime Performance

- [ ] No memory leaks after 10 minutes
- [ ] Smooth scrolling in all panels
- [ ] No UI freezes during operations
- [ ] Resize operations are smooth (60fps)

#### Large Data Sets

- [ ] 100+ messages render correctly
- [ ] 50+ files in file tree
- [ ] Large files (>1MB) load correctly
- [ ] Multiple open files don't cause lag

### Accessibility Testing

#### Keyboard Navigation

- [ ] Tab order is logical
- [ ] All buttons accessible via keyboard
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] Cmd/Ctrl+Enter sends messages

#### Screen Readers

- [ ] Messages are announced
- [ ] Buttons have proper labels
- [ ] Form inputs have labels
- [ ] Landmarks are properly defined
- [ ] Error messages are announced

#### Visual

- [ ] Text contrast ratio meets WCAG AA
- [ ] Focus indicators visible
- [ ] Text is readable at 200% zoom
- [ ] No content loss at high zoom
- [ ] Color is not sole indicator

### Security Testing

#### Iframe Sandbox

- [ ] Preview cannot access parent window
- [ ] Preview cannot navigate parent page
- [ ] Preview cannot read cookies from parent
- [ ] Scripts are properly sandboxed
- [ ] Forms can submit within iframe

#### XSS Prevention

- [ ] HTML in messages is sanitized
- [ ] Script tags don't execute
- [ ] Event handlers are stripped
- [ ] URL validation prevents javascript:
- [ ] Code blocks are safe (no execution)

#### Data Validation

- [ ] File paths are validated
- [ ] URLs are validated
- [ ] User input is sanitized
- [ ] Database queries are parameterized
- [ ] API calls are authenticated

### Error Handling

#### Network Errors

- [ ] Offline state handled gracefully
- [ ] Failed API calls show error message
- [ ] Retry logic works correctly
- [ ] Timeout errors are caught
- [ ] Connection loss is detected

#### User Errors

- [ ] Invalid URLs show error
- [ ] Missing files show error
- [ ] Empty messages are prevented
- [ ] File load failures are handled
- [ ] Navigation errors are caught

#### System Errors

- [ ] JavaScript errors don't crash app
- [ ] Render errors show fallback UI
- [ ] Database errors show message
- [ ] Auth errors redirect to login
- [ ] Rate limit errors are handled

### User Experience

#### First-Time User

- [ ] Empty states are helpful
- [ ] Instructions are clear
- [ ] Actions are discoverable
- [ ] Layout is intuitive
- [ ] No confusion about purpose

#### Power User

- [ ] Keyboard shortcuts work
- [ ] Quick actions available
- [ ] Settings are accessible
- [ ] Customization options exist
- [ ] Advanced features discoverable

#### Edge Cases

- [ ] No internet connection
- [ ] Very long messages
- [ ] Special characters in filenames
- [ ] Binary files
- [ ] Non-UTF8 encoding

## Post-Deployment Verification

### Production Environment

- [ ] All environment variables set
- [ ] API keys configured
- [ ] Database migrations applied
- [ ] CDN serving assets correctly
- [ ] SSL certificate valid
- [ ] Domain configured correctly

### Monitoring

- [ ] Error tracking enabled (Sentry)
- [ ] Analytics tracking works
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alerts configured for errors

### Documentation

- [ ] README updated
- [ ] API docs accurate
- [ ] Component docs complete
- [ ] Examples provided
- [ ] Migration guide available

## Regression Testing

Run these tests after any changes:

1. **Critical Path:**
   - Login → Navigate to /vibe → Send message → See response

2. **File Operations:**
   - Open file → Edit → Save → Verify changes

3. **Preview:**
   - Load URL → Switch viewport → Refresh → Open external

4. **Layout:**
   - Resize panels → Refresh page → Verify sizes preserved

5. **Mobile:**
   - Open on mobile → Navigate all panels → Send message

## Performance Benchmarks

Target metrics:

- **Initial Load:** < 3 seconds
- **Time to Interactive:** < 5 seconds
- **First Contentful Paint:** < 1.5 seconds
- **Largest Contentful Paint:** < 2.5 seconds
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

## Known Issues

Document any known issues here:

1. ~~Monaco Editor not loading~~ - Fixed with lazy loading
2. ~~Lint errors with SyntaxHighlighter~~ - Fixed by removing `as any`
3. ~~Self-assign in refresh handler~~ - Fixed with temp variable

## Testing Tools

Recommended tools:

- **React DevTools:** Component inspection
- **Lighthouse:** Performance audit
- **axe DevTools:** Accessibility testing
- **WAVE:** Visual accessibility check
- **BrowserStack:** Cross-browser testing
- **GTmetrix:** Performance analysis

## Sign-Off

Before deploying to production:

- [ ] All critical tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Security reviewed
- [ ] Documentation complete

**Tested by:** **\*\***\_**\*\***
**Date:** **\*\***\_**\*\***
**Version:** **\*\***\_**\*\***
**Approved by:** **\*\***\_**\*\***
