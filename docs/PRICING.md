# AGI Agent Automation - Pricing Guide

## Current Pricing Plans

**Last Updated:** October 18, 2025  
**Source of Truth:** This document is the canonical reference for all pricing information

### Pro Plan - $29/month

- **Target:** Growing teams and small businesses
- **Features:**
  - Up to 10 AI employees
  - Advanced workflow automation
  - Priority support
  - API access
  - Custom integrations
  - Analytics dashboard
  - Team collaboration
- **Billing:** Monthly subscription
- **Trial:** 14-day free trial included

### Max Plan - $299/month

- **Target:** Businesses requiring maximum AI power
- **Features:**
  - Unlimited AI employees
  - All Pro features included
  - Dedicated account manager
  - Custom AI training
  - White-label options
  - Advanced security features
  - SLA guarantee
  - Phone support
- **Billing:** Monthly subscription
- **Trial:** 14-day free trial included

### Enterprise Plan - Custom Pricing

- **Target:** Large organizations with specific requirements
- **Features:**
  - Everything in Max plan
  - Custom deployment options
  - On-premise available
  - Custom contracts
  - Dedicated infrastructure
  - Compliance certifications
  - Professional services
  - Training programs
- **Billing:** Custom terms
- **Contact:** Sales team for pricing

## Legacy Pricing (Deprecated)

**⚠️ DO NOT USE:** The following pricing is outdated and should not be referenced:

- ~~Pay Per Employee: $1/employee/month~~ (Deprecated)
- ~~All Access: $19/month~~ (Deprecated)

## Implementation Notes

### Database Schema

- Pricing plans stored in `subscription_plans` table
- Stripe price IDs: `price_pro_29`, `price_max_299`
- Enterprise plans handled via custom Stripe checkout

### UI Components

- Main pricing display: `src/pages/PricingPage.tsx`
- Comparison table shows current pricing
- Stripe integration handles checkout flow

### Documentation References

- Update all docs to reference this file
- Remove any references to old $1/$19 pricing
- Ensure consistency across README, implementation plans, and UI

## Migration History

- **October 2025:** Updated from legacy $1/$19 pricing to current $29/$299 structure
- **Migration File:** `supabase/migrations/20251017_update_subscription_plans_pricing.sql` (if exists)

## Validation Checklist

- [ ] All documentation shows $29/$299/Custom
- [ ] UI components display correct pricing
- [ ] Stripe price IDs match database
- [ ] No references to old pricing remain
- [ ] Enterprise contact flow works
- [ ] Trial signup process functional
