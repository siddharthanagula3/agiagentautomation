# 🎟️ Stripe Coupon Setup Guide

## Setting Up the "Betatester" Coupon for 1 Month Free

This guide will help you create the "Betatester" coupon code in Stripe that gives users 1 month free on AI Employee subscriptions.

---

## 📋 Steps to Create the Coupon

### 1. Log into Stripe Dashboard

Go to: https://dashboard.stripe.com

Switch to **Test Mode** (toggle in top right) for testing, or **Live Mode** for production.

---

### 2. Navigate to Coupons

1. Click on **Products** in the left sidebar
2. Click on **Coupons**
3. Click **+ New** button in the top right

---

### 3. Create the "Betatester" Coupon

#### Coupon Details:

**Name:**
```
Betatester - 1 Month Free
```

**ID (Coupon Code):**
```
BETATESTER
```
*(This is the code customers will enter at checkout)*

**Type:**
- Select: **Duration**

**Duration:**
- Select: **Once**
- This will apply the discount only to the first payment

**Discount:**
- Select: **Percentage**
- Enter: **100** %
- This gives 100% off the first month

**Applies to:**
- Select: **All products and prices**
- Or select specific AI Employee products if you want to limit it

**Redemption Limits (Optional):**
- **Max redemptions**: Leave blank for unlimited OR enter a number (e.g., 100 for first 100 users)
- **Duration**: Leave blank for no expiration OR set an expiration date

---

### 4. Save the Coupon

Click **Create coupon** button.

---

## 🧪 Testing the Coupon

### Test in Your App:

1. Go to `/marketplace` in your app
2. Click **Hire Now** on any AI Employee
3. You'll be redirected to Stripe Checkout
4. Look for the **"Add promotion code"** link
5. Enter: **BETATESTER**
6. You should see:
   - Original price: $120/year (or $10/month)
   - Discount: -$10 (100% off first month)
   - Total today: **$110** (for yearly) or **$0** (for monthly)

### Test with Stripe CLI:

```bash
# Check if coupon exists
stripe coupons retrieve BETATESTER

# Test creating a subscription with the coupon
stripe subscriptions create \
  --customer=cus_test123 \
  --items[0][price]=price_test123 \
  --coupon=BETATESTER
```

---

## 💰 How It Works

### For Yearly Subscriptions ($120/year):
- **First charge**: $110 (saved $10 - equivalent to 1 month free)
- **Subsequent charges**: $120/year (full price)

### For Monthly Subscriptions ($10/month):
- **First charge**: $0 (completely free)
- **Subsequent charges**: $10/month (full price)

---

## 📊 Monitoring Coupon Usage

### View Coupon Statistics:

1. Go to: **Products** → **Coupons**
2. Click on **BETATESTER** coupon
3. View:
   - Times redeemed
   - Amount discounted
   - Recent redemptions

### View in Reports:

1. Go to: **Reports**
2. Select: **Coupon usage**
3. Filter by: **BETATESTER**

---

## 🎨 Customization Options

### Alternative Coupon Setups:

#### Option 1: 50% Off First Month
```
Name: Betatester - 50% Off First Month
ID: BETATESTER50
Type: Once
Discount: 50%
```

#### Option 2: $10 Off First Month
```
Name: Betatester - $10 Off
ID: BETATESTER10
Type: Once
Discount: $10 (Fixed amount)
```

#### Option 3: 1 Month Free (using "repeating")
```
Name: Betatester - 1 Month Free
ID: BETATESTER
Type: Repeating
Duration: 1 month
Discount: 100%
```

#### Option 4: 3 Months 50% Off
```
Name: Betatester - 3 Months Half Price
ID: BETATESTER3
Type: Repeating
Duration: 3 months
Discount: 50%
```

---

## 🔐 Security Best Practices

### Limit Redemptions:
- Set **max redemptions** to prevent abuse
- Example: 100 redemptions for beta testers

### Set Expiration Date:
- Add expiration date for limited-time offers
- Example: Valid until end of month

### Create Unique Codes:
- Use unique codes for different campaigns:
  - `BETATESTER` - General beta users
  - `LAUNCH50` - Launch week users
  - `FRIEND20` - Referral program

---

## 🧪 Test Mode vs Live Mode

### Test Mode (for development):
1. Create coupon in **Test Mode**
2. Use test credit cards (4242 4242 4242 4242)
3. No real charges will be made

### Live Mode (for production):
1. Create the same coupon in **Live Mode**
2. Real payments will be processed
3. Make sure to verify the coupon settings!

---

## 📝 Coupon Code Variations

You can create multiple codes for different purposes:

```
BETATESTER      - 1 month free (100% off once)
EARLYBIRD       - $5 off first month
FRIEND10        - 10% off for 3 months
LAUNCH2024      - 2 months free
VIP50           - 50% off forever
```

---

## ⚙️ API Integration (Optional)

If you want to programmatically create coupons:

```javascript
const stripe = require('stripe')('your_secret_key');

const coupon = await stripe.coupons.create({
  id: 'BETATESTER',
  name: 'Betatester - 1 Month Free',
  percent_off: 100,
  duration: 'once',
  max_redemptions: 100,
  redeem_by: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
});
```

---

## ✅ Verification Checklist

- [ ] Coupon created in Stripe dashboard
- [ ] Coupon ID is **BETATESTER** (case-insensitive)
- [ ] Discount type is **100%**
- [ ] Duration is **Once**
- [ ] Applies to all products
- [ ] Tested in checkout flow
- [ ] Verified in Stripe dashboard
- [ ] Created in both Test and Live mode (when ready for production)

---

## 🐛 Troubleshooting

### Coupon not appearing at checkout:
- ✅ Verify `allow_promotion_codes: true` in checkout session
- ✅ Check coupon is not expired
- ✅ Check max redemptions not reached

### Discount not applying correctly:
- ✅ Verify coupon is active
- ✅ Check duration type (once vs repeating)
- ✅ Verify discount percentage/amount

### "Invalid coupon code" error:
- ✅ Check spelling (BETATESTER - case insensitive)
- ✅ Verify coupon exists in correct mode (test vs live)
- ✅ Check coupon hasn't been deleted

---

## 📚 Additional Resources

- [Stripe Coupons Documentation](https://stripe.com/docs/billing/subscriptions/coupons)
- [Stripe Checkout Promotion Codes](https://stripe.com/docs/payments/checkout/discounts)
- [Stripe API - Coupons](https://stripe.com/docs/api/coupons)

---

## 💡 Pro Tips

1. **Track conversions**: Monitor which coupons drive the most subscriptions
2. **A/B test**: Try different discount percentages to find optimal conversion
3. **Time-limited offers**: Create urgency with expiration dates
4. **Referral codes**: Give unique codes to influencers/partners
5. **Seasonal campaigns**: Create holiday-specific coupons

Happy discounting! 🎉

