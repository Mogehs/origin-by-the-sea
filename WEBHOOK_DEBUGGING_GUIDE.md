# Webhook Debugging Guide

## Issues Fixed

### 1. **Raw Body for Webhook**

- ✅ Updated `app.js` to use `express.raw()` for webhook route
- Stripe requires raw body for signature verification
- JSON body parser now only applies to non-webhook routes

### 2. **Payment Intent Metadata Update**

- ✅ Backend now updates the Payment Intent metadata with `orderId` after creating the order
- This ensures the webhook has access to the `orderId` when processing `payment_intent.succeeded`

### 3. **Enhanced Logging**

- ✅ Added comprehensive logging throughout the webhook flow
- ✅ Logs now show:
  - When webhook is received
  - Signature verification status
  - Event type and ID
  - Order ID from metadata
  - Order update process
  - Success/failure status

### 4. **Order Status Update**

- ✅ Now updates both `paymentStatus` AND `status` fields in Firestore
- This ensures the order is properly marked as "paid"

## Why Webhooks Might Be Called 3 Times

Stripe retries webhooks if:

1. **Initial call fails** (returns 4xx or 5xx error)
2. **Timeout** (no response within 30 seconds)
3. **Connection issues**

The retry schedule is:

- Immediate retry
- 1 hour later
- 2 hours later
- Then increasing intervals

## How to Verify It's Working

### 1. Check Backend Logs

Look for these log messages when a payment succeeds:

```
🔔 Webhook received!
✅ Webhook signature verified. Event type: payment_intent.succeeded
🎯 Processing webhook event: payment_intent.succeeded
💳 Payment succeeded for Payment Intent: pi_xxx
📦 Order ID from metadata: xxx
🔄 Updating order xxx to 'paid' status...
📝 updateOrderStatus called with orderId: xxx, status: paid
🔍 Fetching order xxx from database...
✅ Order xxx found. Current status: pending
🔄 Updating order xxx to status: paid...
✅ Order xxx successfully updated in Firestore
💰 Payment succeeded, handling post-payment tasks...
✅ Successfully updated order xxx to status paid
✅ Order xxx successfully updated to 'paid'
✅ Webhook payment_intent.succeeded processed successfully
```

### 2. Check Stripe Dashboard

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. Check the **Logs** tab
4. Look for `payment_intent.succeeded` events
5. Verify response is `200 OK`

### 3. Check Firestore

1. Open Firebase Console
2. Go to Firestore Database
3. Find your order in the `orders` collection
4. Verify:
   - `status` = "paid"
   - `paymentStatus` = "paid"
   - `paymentData` contains the payment intent details

## Testing with Stripe CLI

If you want to test webhooks locally without ngrok:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/payment/webhook

# In another terminal, trigger a test payment
stripe trigger payment_intent.succeeded
```

## Common Issues

### Issue 1: "Webhook signature verification failed"

**Cause**: Wrong webhook secret or body not raw
**Fix**:

- Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches Stripe Dashboard
- Ensure webhook route gets raw body (already fixed)

### Issue 2: Order not updating to "paid"

**Cause**: Missing orderId in payment intent metadata
**Fix**: Already fixed - backend now updates payment intent metadata with orderId

### Issue 3: Multiple webhook calls

**Cause**: Webhook returning error, causing Stripe to retry
**Fix**: Check logs for errors, ensure webhook returns 200 OK

### Issue 4: No console logs

**Cause**:

- Server not running
- Wrong port/URL in ngrok
- Logs not being output

**Fix**:

- Verify server is running: `npm start` or `node server.js`
- Check ngrok is forwarding to correct port
- Check Logger configuration

## Ngrok Setup

### 1. Start your backend server

```bash
cd backend
npm start  # or node server.js
```

### 2. Start ngrok

```bash
ngrok http 3000  # Replace 3000 with your backend port
```

### 3. Copy the HTTPS URL

Example: `https://abc123.ngrok.io`

### 4. Add webhook endpoint in Stripe

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://abc123.ngrok.io/api/payment/webhook`
4. Events to send: Select `payment_intent.succeeded` and `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 5. Update .env

```env
STRIPE_WEBHOOK_SECRET=whsec_your_ngrok_webhook_secret
```

### 6. Restart backend server

```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

## Debugging Checklist

- [ ] Backend server is running
- [ ] ngrok is running and forwarding to backend
- [ ] Stripe webhook endpoint configured with ngrok URL
- [ ] STRIPE_WEBHOOK_SECRET in .env matches Stripe Dashboard
- [ ] Backend restarted after updating .env
- [ ] Check backend console for webhook logs
- [ ] Check Stripe Dashboard webhook logs
- [ ] Verify order in Firestore

## Important Notes

1. **Ngrok URLs change** every time you restart ngrok (unless you have a paid plan)

   - You need to update the Stripe webhook endpoint URL each time
   - You get a new signing secret each time you update the endpoint

2. **Environment Variables**

   - Always restart the backend after changing .env
   - The STRIPE_WEBHOOK_SECRET must match the one in Stripe Dashboard

3. **Idempotency**
   - Even if webhook is called multiple times, the order update is idempotent
   - It's safe to update the same order multiple times to "paid" status

## Support

If you're still having issues:

1. Share the backend console logs
2. Share the Stripe webhook logs from Dashboard
3. Check if the order exists in Firestore with the correct `paymentIntentId`
