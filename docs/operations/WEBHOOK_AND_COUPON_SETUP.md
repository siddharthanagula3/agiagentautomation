# Production Webhook & Discount Coupon Setup

## ✅ Completed Setup

### Production Webhook
- **URL**: `https://agiagentautomation.com/.netlify/functions/stripe-webhook`
- **ID**: `we_1SSTUl0atLU7AWGTUYVLI2id`
- **Status**: ✅ Enabled
- **Events Configured**:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### Webhook Signing Secret
```
whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr
```

**⚠️ IMPORTANT**: Set this in Netlify as `STRIPE_WEBHOOK_SECRET`

### Discount Coupon
- **Code**: `BETATESTER100OFF`
- **Discount**: 100% off
- **Duration**: One-time use
- **Status**: ✅ Valid

## 🔧 Configuration Required

### Netlify Environment Variables

Add/Update in Netlify Dashboard → Site Settings → Environment Variables:

```
STRIPE_WEBHOOK_SECRET=whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr
```

After setting, **redeploy** your site.

## ✅ Verification

1. **Check Webhook in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Verify webhook shows as "Enabled"
   - Check events are being received

2. **Test Discount Code**:
   - Go to checkout
   - Enter code: `BETATESTER100OFF`
   - Should apply 100% discount

3. **Test Webhook**:
   - Make a test purchase
   - Check Stripe Dashboard → Webhooks → Events
   - Verify event was received and processed

## 📝 Notes

- Webhook is configured for **LIVE mode** (using LIVE Stripe keys)
- Discount code is **one-time use** per customer
- Webhook signing secret must match in Netlify for webhook verification to work

## 🆘 Troubleshooting

### Webhook not receiving events?
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Netlify
- Check webhook is enabled in Stripe Dashboard
- Check Netlify function logs for errors

### Discount code not working?
- Verify coupon is active in Stripe Dashboard
- Check code spelling: `BETATESTER100OFF` (case-sensitive)
- Verify it's a one-time use coupon (already used?)

