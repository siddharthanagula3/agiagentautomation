# Comprehensive Testing Plan

## Overview

This document outlines all testing procedures for the AGI Agent Automation platform. All tests should be performed after production deployment.

## Pre-Testing Checklist

- [ ] Application deployed to production
- [ ] All environment variables configured in Netlify
- [ ] Stripe webhook endpoint created and configured
- [ ] User account created and authenticated
- [ ] Database accessible and queries working

## 1. Token Pack Purchase Flow Testing

### 1.1 UI Flow Test

**Objective**: Verify token pack purchase UI works correctly

**Steps**:

1. Navigate to `/billing` page
2. Verify token pack options are displayed
3. Click "Buy" button on a token pack
4. Verify redirect to Stripe checkout page

**Expected Result**:

- Token packs display correctly
- Buy button works
- Redirects to Stripe checkout

**Status**: ⏳ Ready to test after deployment

### 1.2 Checkout Test

**Objective**: Complete a test purchase

**Steps**:

1. Use Stripe test card: `4242 4242 4242 4242`
2. Enter any future expiry date (e.g., 12/25)
3. Enter any 3-digit CVC (e.g., 123)
4. Complete the purchase

**Expected Result**:

- Checkout completes successfully
- Redirects back to application

**Status**: ⏳ Ready to test after deployment

### 1.3 Webhook Processing Test

**Objective**: Verify webhook receives and processes events

**Steps**:

1. Complete a test purchase
2. Check Stripe Dashboard → Webhooks → Events
3. Verify `checkout.session.completed` event received
4. Verify `metadata.type === 'token_pack_purchase'`
5. Check Netlify function logs for processing

**Expected Result**:

- Event received within 1-2 seconds
- Metadata correct
- No errors in logs

**Status**: ⏳ Ready to test after deployment

### 1.4 Database Update Test

**Objective**: Verify tokens added to user balance

**Steps**:

1. Note user's token balance before purchase
2. Complete test purchase
3. Query database: `SELECT token_balance FROM users WHERE id = 'user-id'`
4. Verify balance increased by purchased amount
5. Check `token_transactions` table for new entry

**Expected Result**:

- Balance updated correctly
- Transaction logged with correct details

**Status**: ⏳ Ready to test after deployment

### 1.5 Success Redirect Test

**Objective**: Verify success redirect and UI updates

**Steps**:

1. Complete test purchase
2. Verify redirect to `/billing?success=true&tokens=XXXX`
3. Verify success toast notification displays
4. Verify token balance updates in UI
5. Verify balance reflects in dashboard

**Expected Result**:

- Redirect URL correct
- Toast notification shows
- UI updates immediately

**Status**: ⏳ Ready to test after deployment

## 2. Custom Shortcuts Feature Testing

### 2.1 Create Shortcut Test

**Objective**: Verify shortcut creation works

**Steps**:

1. Log in to application
2. Navigate to chat interface
3. Click "Create Custom Shortcut" button
4. Fill in:
   - Label: "Test Shortcut"
   - Prompt: "Test prompt text"
   - Category: "general"
5. Click "Create"

**Expected Result**:

- Shortcut created successfully
- Appears in shortcuts list

**Status**: ⏳ Ready to test after deployment

### 2.2 Database Verification Test

**Objective**: Verify shortcut saved in database

**Steps**:

1. Create a shortcut (as above)
2. Query database: `SELECT * FROM user_shortcuts WHERE user_id = 'user-id'`
3. Verify shortcut data matches input

**Expected Result**:

- Shortcut exists in database
- All fields correct

**Status**: ⏳ Ready to test after deployment

### 2.3 Usage Test

**Objective**: Verify shortcut can be used

**Steps**:

1. Click on created shortcut
2. Verify prompt populates in chat input
3. Verify prompt text is correct
4. Send message and verify it works

**Expected Result**:

- Prompt populates correctly
- Can send message with shortcut

**Status**: ⏳ Ready to test after deployment

### 2.4 Delete Shortcut Test

**Objective**: Verify shortcut deletion works

**Steps**:

1. Hover over shortcut
2. Click delete button
3. Confirm deletion
4. Verify shortcut removed from list
5. Query database to verify deletion

**Expected Result**:

- Shortcut removed from UI
- Removed from database

**Status**: ⏳ Ready to test after deployment

## 3. Artifact Gallery Testing

### 3.1 Demo Data Creation (Optional)

**Objective**: Create test artifacts for gallery

**Steps**:

1. Use SQL editor in Supabase Dashboard
2. Insert test artifacts:

```sql
INSERT INTO public_artifacts (user_id, title, type, description, content, author_name, views, likes, tags, is_public)
VALUES
('user-id', 'Interactive Calculator', 'html', 'A simple calculator built with HTML/CSS/JS',
 '<html><!-- calculator code --></html>', 'Test User', 42, 15, ARRAY['html', 'javascript'], true),
('user-id', 'SVG Animation', 'svg', 'Smooth CSS animations',
 '<svg><!-- svg code --></svg>', 'Test User', 28, 8, ARRAY['svg', 'animation'], true);
```

**Expected Result**:

- Artifacts created in database

**Status**: ⏳ Ready to test after deployment

### 3.2 Navigation Test

**Objective**: Verify gallery page loads correctly

**Steps**:

1. Navigate to `/gallery`
2. Verify page loads without errors
3. Verify artifact cards display
4. Verify layout is correct

**Expected Result**:

- Page loads successfully
- Artifacts display correctly

**Status**: ⏳ Ready to test after deployment

### 3.3 Search and Filter Test

**Objective**: Verify search and filter functionality

**Steps**:

1. Test search functionality:
   - Enter search term
   - Verify results filter correctly
2. Test type filter:
   - Select "HTML" filter
   - Verify only HTML artifacts show
   - Test other types
3. Test sorting:
   - Sort by "Recent"
   - Sort by "Popular"
   - Sort by "Trending"
   - Verify order changes correctly

**Expected Result**:

- Search works correctly
- Filters work correctly
- Sorting works correctly

**Status**: ⏳ Ready to test after deployment

### 3.4 Artifact Preview Test

**Objective**: Verify artifact viewing works

**Steps**:

1. Click "View Artifact" on an artifact card
2. Verify artifact preview displays
3. Verify content renders correctly
4. Test close button
5. Test fullscreen view (if available)

**Expected Result**:

- Preview displays correctly
- Content renders properly
- Navigation works

**Status**: ⏳ Ready to test after deployment

## 4. Monitoring and Verification

### 4.1 Netlify Function Logs

**Check**:

- No errors in function execution
- Webhook processing successful
- Response times acceptable

### 4.2 Supabase Database Logs

**Check**:

- No connection errors
- Query performance acceptable
- RLS policies working correctly

### 4.3 Stripe Webhook Events

**Check**:

- Events received successfully
- No failed events
- Processing times acceptable

### 4.4 User Token Balances

**Check**:

- Balances updating correctly
- Transactions logging properly
- No discrepancies

## Test Results Template

For each test, document:

```
Test: [Test Name]
Date: [Date]
Status: [Pass/Fail]
Notes: [Any issues or observations]
Screenshots: [If applicable]
```

## Success Criteria

All tests pass when:

- ✅ Token purchases work end-to-end
- ✅ Custom shortcuts work completely
- ✅ Artifact gallery displays and functions correctly
- ✅ No errors in logs
- ✅ Database updates correctly
- ✅ Webhooks process successfully

## Troubleshooting

If tests fail:

1. Check browser console for errors
2. Check Netlify function logs
3. Check Supabase database logs
4. Check Stripe webhook events
5. Verify environment variables
6. Verify database migrations applied
7. Check RLS policies
