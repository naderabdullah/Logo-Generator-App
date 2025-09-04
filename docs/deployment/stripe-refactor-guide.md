# 🚀 Stripe Webhook Refactor - Deployment Guide (Zero Backward Compatibility)

## 🚨 CRITICAL: This affects payment processing - any sessions with old metadata will fail!

---

## 📋 **Pre-Deployment Checklist**

### **1. Database Configuration Verification**

**AppUsers Table Requirements:**
- ✅ **Primary Key**: `AppId` (String) + `EmailSubAppId` (String)
- ✅ **GSI: EmailIndex**: `Email` (PK) + `AppId` (SK) - **MUST BE ACTIVE**
- ✅ **Required Fields**: AppId, EmailSubAppId, Email, Status
- ✅ **Test Query**: Verify EmailIndex GSI responds to queries

**Supabase Configuration:**
- ✅ **users table**: id (PK), email, logosCreated, logosLimit
- ✅ **Connection**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- ✅ **Permissions**: Service role can INSERT/UPDATE users table

### **2. Environment Variables Check**
```bash
# Required for DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Required for Stripe
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ⏰ **DEPLOYMENT TIMING STRATEGY**

### **Optimal Deployment Window**
```bash
# Recommended: 3:00 AM Sunday (UTC)
# - Lowest global traffic
# - Weekend = fewer business transactions
# - 24-hour window before Monday business hours
```

### **Pre-Deployment Actions (24 Hours Before)**
1. **Monitor Stripe Dashboard**: Track checkout session creation rate
2. **Notify Customers**: Brief maintenance notice (optional)
3. **Alert Support Team**: Have admin tools ready for manual credit additions
4. **Prepare Scripts**: Automated payment recovery scripts ready

---

## 🚀 **Deployment Steps**

### **Step 1: Pre-Deployment Backup & Testing**
```bash
# Backup current route files
cp src/app/api/stripe/webhook/route.ts src/app/api/stripe/webhook/route.ts.backup
cp src/app/api/stripe/create-checkout/route.ts src/app/api/stripe/create-checkout/route.ts.backup

# Test AppUsers EmailIndex GSI
aws dynamodb query --table-name AppUsers \
  --index-name EmailIndex \
  --key-condition-expression "Email = :email AND AppId = :appId" \
  --expression-attribute-values '{":email":{"S":"test@example.com"},":appId":{"S":"logo-generator"}}'
```

### **Step 2: Deploy Create Checkout Route**
1. **Update**: `src/app/api/stripe/create-checkout/route.ts`
2. **Test**: Create a test checkout session immediately
3. **Verify**: Session metadata contains `userEmail` and `appId` (not `userId`)

### **Step 3: Deploy Webhook Route (CRITICAL)**
```bash
# Deploy during optimal window
# Monitor immediately after deployment
```

### **Step 4: Immediate Verification**
```bash
# Check webhook endpoint responds
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook_active"}'

# Should return error about missing signature (this is expected)
```

---

## 🧪 **Testing Procedures**

### **Test 1: New Metadata Format (Only Format Supported)**
```javascript
// Webhook should receive this format
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "payment_status": "paid",
      "metadata": {
        "userEmail": "test@example.com",
        "appId": "logo-generator", 
        "quantity": "5"
      }
    }
  }
}
```

**Expected Flow:**
1. ✅ Extracts `userEmail`, `appId`, `quantity` from metadata
2. ✅ Queries AppUsers via EmailIndex GSI
3. ✅ Verifies user status is `active` or `pending`
4. ✅ Updates/creates Supabase logo credits
5. ✅ Logs success with user email and new credit total

### **Test 2: Error Scenarios (Must Handle Gracefully)**
```javascript
// Missing metadata
{"metadata": {"quantity": "5"}} // Missing userEmail/appId

// Invalid user  
{"metadata": {"userEmail": "nonexistent@test.com", "appId": "logo-generator", "quantity": "5"}}

// Invalid status
// User exists but Status = "inactive"

// Invalid quantity
{"metadata": {"userEmail": "test@example.com", "appId": "logo-generator", "quantity": "0"}}
```

**Expected Results:**
- ❌ Clear error messages in webhook response
- ❌ Detailed logging of failure reasons
- ❌ NO credits added to any user account
- ❌ HTTP 400 status returned to Stripe

---

## 📊 **Monitoring & Validation**

### **Critical Success Metrics**
```bash
# Webhook processing success rate (should be ~100% for valid payments)
grep "Payment processing completed successfully" /var/log/webhook.log | wc -l

# User lookups succeeding
grep "Found user in AppUsers" /var/log/webhook.log | wc -l

# Credit additions
grep "logo limit updated from" /var/log/webhook.log | wc -l
```

### **Critical Failure Alerts**
```bash
# These patterns indicate problems requiring immediate attention:
grep "not found in AppUsers" /var/log/webhook.log
grep "Missing required metadata" /var/log/webhook.log
grep "invalid status" /var/log/webhook.log
grep "Webhook error" /var/log/webhook.log
```

### **Real-Time Monitoring Commands**
```bash
# Watch webhook processing in real-time
tail -f /var/log/webhook.log | grep -E "(Processing payment|Payment processing completed|❌)"

# Monitor Stripe webhook delivery success in dashboard
# URL: https://dashboard.stripe.com/webhooks
```

---

## 🚨 **FAILURE SCENARIOS & RECOVERY**

### **Scenario 1: Old Metadata Sessions Complete Payment**
**Symptoms:**
```bash
grep "Missing required metadata" /var/log/webhook.log
```

**Recovery:**
1. **Identify affected sessions**: Query Stripe API for failed webhooks
2. **Extract payment details**: Get customer email and quantity from Stripe
3. **Manual credit addition**: Use admin tools to add credits directly
4. **Customer notification**: Email customers about delay

### **Scenario 2: AppUsers GSI Failure**
**Symptoms:**
```bash
grep "not found in AppUsers" /var/log/webhook.log
```

**Recovery:**
1. **Verify GSI status**: Check DynamoDB console for EmailIndex status
2. **Wait for GSI rebuild**: If GSI is rebuilding, wait for completion
3. **Manual processing**: Process failed payments once GSI is active

### **Scenario 3: Supabase Connection Issues**
**Symptoms:**
```bash
grep "Error updating user logo limit" /var/log/webhook.log
```

**Recovery:**
1. **Check Supabase status**: Verify service availability
2. **Retry failed payments**: Re-process once Supabase is available
3. **Database integrity**: Verify no duplicate credit additions

---

## 🔄 **Rollback Plan**

### **Immediate Rollback (< 5 minutes):**
```bash
# Restore backup files
cp src/app/api/stripe/webhook/route.ts.backup src/app/api/stripe/webhook/route.ts
cp src/app/api/stripe/create-checkout/route.ts.backup src/app/api/stripe/create-checkout/route.ts

# Redeploy immediately
npm run deploy # or your deployment command
```

**⚠️ Warning**: Rollback will cause NEW sessions to fail if customers have already started checkouts with new metadata format.

### **Post-Rollback Actions:**
1. **Monitor new failures**: Now new metadata format will fail
2. **Manual processing**: Process both old and new failed payments
3. **Plan re-deployment**: With better timing/testing

---

## 🛠️ **Manual Credit Recovery Scripts**

### **Query Failed Payments**
```bash
# Get Stripe sessions that failed webhook processing
curl -X GET "https://api.stripe.com/v1/events?type=checkout.session.completed&limit=100" \
  -H "Authorization: Bearer sk_test_..."
```

### **Add Credits Manually**
```sql
-- Supabase SQL to add credits
UPDATE users 
SET logosLimit = logosLimit + {quantity}
WHERE email = '{customer_email}';
```

### **Verification Query**
```sql
-- Verify credit addition
SELECT email, logosLimit, updated_at 
FROM users 
WHERE email = '{customer_email}';
```

---

## 📈 **Success Criteria**

### **First Hour After Deployment:**
- [ ] **All new payments process successfully** (webhook returns 200)
- [ ] **User credits added correctly** (Supabase updated)
- [ ] **No customer complaints** about missing credits
- [ ] **Webhook logs show normal processing** patterns

### **First 24 Hours:**
- [ ] **Payment success rate maintains** previous levels
- [ ] **No manual interventions required**
- [ ] **Customer support tickets remain normal**
- [ ] **Financial reconciliation accurate**

### **Post-Deployment Cleanup (After 7 Days):**
- [ ] Remove backup files
- [ ] Update monitoring dashboards to remove old metric references
- [ ] Document lessons learned
- [ ] Update runbooks with new webhook format

---

## 🚨 **EMERGENCY CONTACTS**
- **Primary Developer**: [Phone] / [Email]
- **Database Admin**: [Phone] / [Email]
- **Customer Support Manager**: [Phone] / [Email]
- **Stripe Support**: https://support.stripe.com

---

## ⚡ **DEPLOYMENT CHECKLIST**

**Pre-Deploy (Day Before):**
- [ ] AppUsers EmailIndex GSI is active and tested
- [ ] Supabase connection verified
- [ ] Support team notified and ready
- [ ] Recovery scripts prepared
- [ ] Monitoring alerts configured

**Deploy Time:**
- [ ] Deploy create-checkout route first
- [ ] Test checkout session creation
- [ ] Deploy webhook route
- [ ] Test webhook with sample data
- [ ] Monitor first 5 payments closely

**Post-Deploy (First Hour):**
- [ ] Monitor webhook logs continuously
- [ ] Check Stripe webhook delivery dashboard
- [ ] Verify Supabase credit updates
- [ ] Confirm no customer support tickets

**Remember: NO backward compatibility = higher risk but simpler code. Monitor closely!**