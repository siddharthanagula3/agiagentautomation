# Stripe Integration for AI Employee Hiring

## Overview
This document outlines the implementation plan for integrating Stripe payments to enable users to hire AI employees with the new pricing structure ($10/month standard, $20/month premium).

## Architecture

### 1. Stripe Products & Prices
- Create a Stripe Product for each AI Employee role
- Attach recurring monthly prices ($10 or $20)
- Store Stripe price IDs in the database

### 2. Backend Integration
- **Netlify Functions** for secure Stripe operations:
  - `create-checkout-session.ts`: Create Stripe Checkout sessions
  - `stripe-webhook.ts`: Handle Stripe webhook events
  - `manage-subscription.ts`: Update, cancel subscriptions
  - `get-billing-portal.ts`: Access Stripe Customer Portal

### 3. Database Schema Updates
- Add `stripe_price_id` to AI employee records (or separate pricing table)
- Add `stripe_customer_id` to user profiles
- Add `stripe_subscription_id` to purchased_employees table
- Track subscription status (active, canceled, past_due, etc.)

### 4. Frontend Components
- **Checkout Button**: Initiate Stripe Checkout
- **Subscription Management**: View and manage active subscriptions
- **Billing History**: Display invoices and payment history
- **Payment Method Management**: Update card details

### 5. Webhook Events to Handle
- `checkout.session.completed`: Activate employee after payment
- `invoice.payment_succeeded`: Continue subscription
- `invoice.payment_failed`: Suspend access
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Remove employee access

## Implementation Steps

### Phase 1: Backend Setup
1. Install Stripe SDK: `npm install stripe`
2. Create Stripe account and get API keys (Test + Production)
3. Set up environment variables in Netlify
4. Create Netlify serverless functions
5. Set up webhook endpoint and verify signatures

### Phase 2: Database Updates
1. Create migration to add Stripe-related columns
2. Update `ai-employees.ts` to include `stripePriceId`
3. Seed Stripe products and prices
4. Store price IDs in database

### Phase 3: Frontend Integration
1. Update MarketplacePage to use Stripe Checkout
2. Add subscription management to WorkforcePage
3. Create billing page with invoice history
4. Implement payment method updates

### Phase 4: Testing
1. Test checkout flow with Stripe test cards
2. Test webhook events (success, failure, cancellation)
3. Test subscription updates and cancellations
4. Verify access control based on subscription status

### Phase 5: Production Deployment
1. Switch to production Stripe keys
2. Configure production webhook endpoint
3. Monitor first real transactions
4. Set up Stripe Dashboard monitoring

## Security Considerations
- Never expose Stripe secret keys in client code
- Use Netlify Functions for all Stripe API calls
- Verify webhook signatures to prevent fraud
- Implement idempotency keys for payment operations
- Store minimal payment data (only IDs, not card details)

## Cost Structure
- **Stripe Fees**: 2.9% + $0.30 per transaction
- **Monthly Revenue**: 
  - Standard ($10): You get ~$9.41 per employee/month
  - Premium ($20): You get ~$18.91 per employee/month

## Next Steps
1. Get Stripe API keys from dashboard.stripe.com
2. Create Stripe Products via Dashboard or API
3. Implement Netlify Functions
4. Update database schema
5. Build frontend UI
6. Test thoroughly with test mode
7. Go live!

