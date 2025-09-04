# 🎯 Complete Stripe Refactor Deployment Checklist

## 📦 **REQUIRED ARTIFACTS & VERSIONS**

### **Artifact 1: Stripe Create Checkout Route**
- **File**: `src/app/api/stripe/create-checkout/route.ts`
- **Action**: **🔄 COMPLETE REPLACEMENT** (clean swap)
- **Artifact**: `stripe-create-checkout-refactored`
- **Status**: ✅ Ready for direct replacement

### **Artifact 2: Stripe Webhook Route**
- **File**: `src/app/api/stripe/webhook/route.ts`
- **Action**: **🔄 COMPLETE REPLACEMENT** (clean swap)
- **Artifact**: `stripe-webhook-refactored`
- **Status**: ✅ Ready for direct replacement

### **Artifact 3: Testing Utility** (Optional but Recommended)
- **File**: `src/utils/webhook-test-utility.ts` (new file)
- **Action**: **➕ CREATE NEW FILE**
- **Artifact**: `webhook-test-utility`
- **Status**: ✅ Standalone testing tool

### **Artifact 4: Recovery Script** (Essential for Safety)
- **File**: `src/utils/payment-recovery-script.ts` (new file)
- **Action**: **➕ CREATE NEW FILE**
- **Artifact**: `payment-recovery-script`
- **Status**: ✅ Emergency recovery tool

### **Artifact 5: Deployment Guide**
- **File**: Documentation reference
- **Action**: **📖 REFERENCE GUIDE**
- **Artifact**: `stripe-refactor-deployment-guide`
- **Status**: ✅ Procedural documentation

---

## ⚙️ **REQUIRED CONFIGURATIONS**

### **1. Environment Variables (.env.local for localhost)**
```bash
# === STRIPE CONFIGURATION (REQUIRED) ===
STRIPE_SECRET_KEY=sk_test_... # Use sk_test_ for local testing
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe Dashboard

# === AWS DYNAMODB (REQUIRED) ===
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# === SUPABASE (REQUIRED) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# === APPLICATION URLs (REQUIRED) ===
SITE_URL=http://localhost:3000 # For localhost testing
# SITE_URL=https://yourdomain.com # For production

# === JWT (REQUIRED) ===
JWT_ACCESS_TOKEN_SECRET=your_jwt_secret

# === LEGACY (NOT USED - can be removed after refactor) ===
# DYNAMODB_USERS_TABLE=users # No longer needed
```

### **2. Database Configuration**

#### **AppUsers Table (DynamoDB) - MUST BE CONFIGURED**
```json
{
  "TableName": "AppUsers",
  "KeySchema": [
    {"AttributeName": "AppId", "KeyType": "HASH"},
    {"AttributeName": "EmailSubAppId", "KeyType": "RANGE"}
  ],
  "AttributeDefinitions": [
    {"AttributeName": "AppId", "AttributeType": "S"},
    {"AttributeName": "EmailSubAppId", "AttributeType": "S"},
    {"AttributeName": "Email", "AttributeType": "S"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "EmailIndex",
      "KeySchema": [
        {"AttributeName": "Email", "KeyType": "HASH"},
        {"AttributeName": "AppId", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}
```

**⚠️ CRITICAL**: EmailIndex GSI must be **ACTIVE** before deployment!

#### **Supabase users table - MUST BE CONFIGURED**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  logosCreated INTEGER DEFAULT 0,
  logosLimit INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for email lookups
CREATE INDEX idx_users_email ON users(email);
```

### **3. Stripe Dashboard Configuration**

#### **Webhook Endpoint Setup**
```
URL: https://yourdomain.com/api/stripe/webhook
Events to send:
  ✅ checkout.session.completed
Methods: POST
Status: Enabled
```

**For localhost testing:**
```
URL: https://your-ngrok-url.ngrok.io/api/stripe/webhook
```

---

## 🏠 **LOCALHOST TESTING SETUP**

### **Step 1: Install ngrok (Required for webhook testing)**
```bash
# Install ngrok
npm install -g ngrok
# OR download from https://ngrok.com/

# Start your Next.js app
npm run dev

# In another terminal, expose localhost to internet
ngrok http 3000
```

### **Step 2: Configure Stripe Webhook for Local Testing**
```bash
# 1. Copy ngrok URL (e.g., https://abc123.ngrok.io)
# 2. Go to Stripe Dashboard → Webhooks
# 3. Add endpoint: https://abc123.ngrok.io/api/stripe/webhook
# 4. Select event: checkout.session.completed
# 5. Copy webhook secret (starts with whsec_)
```

### **Step 3: Local Environment Setup**
```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_51ABC... # Test key from Stripe
STRIPE_WEBHOOK_SECRET=whsec_... # From webhook endpoint
SITE_URL=http://localhost:3000

# All other environment variables as listed above
```

### **Step 4: Test Local Webhook**
```bash
# Method 1: Use the testing utility
node src/utils/webhook-test-utility.ts

# Method 2: Create real test purchase
# 1. Go to http://localhost:3000/purchase
# 2. Use Stripe test card: 4242 4242 4242 4242
# 3. Complete purchase
# 4. Check console logs for webhook processing
```

**✅ YES - Full testing works on localhost with ngrok tunnel**

---

## 🔧 **FILE REPLACEMENT GUIDE**

### **File 1: Create Checkout Route**
```bash
# Current file: src/app/api/stripe/create-checkout/route.ts
# Action: COMPLETE REPLACEMENT (clean swap)
# Artifact: stripe-create-checkout-refactored

# Steps:
cp src/app/api/stripe/create-checkout/route.ts src/app/api/stripe/create-checkout/route.ts.backup
# Replace entire file with artifact content
# No surgical edits needed
```

**Ready for clean swap**: ✅ YES

### **File 2: Webhook Route**
```bash
# Current file: src/app/api/stripe/webhook/route.ts
# Action: COMPLETE REPLACEMENT (clean swap)  
# Artifact: stripe-webhook-refactored

# Steps:
cp src/app/api/stripe/webhook/route.ts src/app/api/stripe/webhook/route.ts.backup
# Replace entire file with artifact content
# No surgical edits needed
```

**Ready for clean swap**: ✅ YES

### **File 3: Testing Utility** (New)
```bash
# New file: src/utils/webhook-test-utility.ts
# Action: CREATE NEW FILE
# Artifact: webhook-test-utility

# Steps:
mkdir -p src/utils
# Create new file with artifact content
# No edits needed
```

**Ready for clean creation**: ✅ YES

### **File 4: Recovery Script** (New)
```bash
# New file: src/utils/payment-recovery-script.ts  
# Action: CREATE NEW FILE
# Artifact: payment-recovery-script

# Steps:
mkdir -p src/utils
# Create new file with artifact content
# No edits needed
```

**Ready for clean creation**: ✅ YES

---

## ✅ **PRE-DEPLOYMENT VERIFICATION**

### **Database Readiness Check**
```bash
# 1. Verify AppUsers EmailIndex GSI is ACTIVE
aws dynamodb describe-table --table-name AppUsers

# 2. Test AppUsers query
aws dynamodb query --table-name AppUsers \
  --index-name EmailIndex \
  --key-condition-expression "Email = :email AND AppId = :appId" \
  --expression-attribute-values '{
    ":email":{"S":"test@example.com"},
    ":appId":{"S":"logo-generator"}
  }'

# 3. Test Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/rest/v1/users?select=email&limit=1"
```

### **Environment Check**
```bash
# Visit your local endpoint
curl http://localhost:3000/api/debug/env-check

# Should show all required variables as "configured"
```

### **Stripe Integration Check**
```bash
# Test Stripe configuration
curl -X POST http://localhost:3000/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=your_test_token" \
  -d '{"quantity": 1, "priceUsd": 4.95, "email": "test@example.com"}'

# Should return: {"url": "https://checkout.stripe.com/..."}
```

---

## 🚀 **DEPLOYMENT SEQUENCE**

### **Step 1: Backup Current Files**
```bash
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp src/app/api/stripe/create-checkout/route.ts backups/$(date +%Y%m%d_%H%M%S)/
cp src/app/api/stripe/webhook/route.ts backups/$(date +%Y%m%d_%H%M%S)/
```

### **Step 2: Deploy Files (Exact Order)**
```bash
# 1. Create testing utilities first
cp artifact-webhook-test-utility.ts src/utils/webhook-test-utility.ts
cp artifact-payment-recovery-script.ts src/utils/payment-recovery-script.ts

# 2. Deploy create-checkout route (lower risk)
cp artifact-stripe-create-checkout-refactored.ts src/app/api/stripe/create-checkout/route.ts

# 3. Test create-checkout immediately
npm run test:stripe-checkout

# 4. Deploy webhook route (higher risk - time this carefully!)
cp artifact-stripe-webhook-refactored.ts src/app/api/stripe/webhook/route.ts

# 5. Test webhook immediately  
npm run test:stripe-webhook
```

### **Step 3: Immediate Verification**
```bash
# Check webhook endpoint responds
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "endpoint_check"}'

# Should return error about missing signature (this is expected)
```

---

## 🧪 **TESTING VALIDATION**

### **Local Testing (Before Deployment)**
```bash
# 1. Start app with ngrok
npm run dev
ngrok http 3000

# 2. Update Stripe webhook URL to ngrok URL

# 3. Run test suite
node src/utils/webhook-test-utility.ts

# 4. Make real test purchase
# - Go to /purchase
# - Use test card 4242 4242 4242 4242
# - Check logs for successful credit addition

# 5. Verify credits in database
# Check Supabase users table for credit addition
```

### **Production Testing (After Deployment)**
```bash
# 1. Monitor webhook logs
tail -f /var/log/webhook.log

# 2. Create small test purchase ($4.95 for 1 credit)

# 3. Verify success pattern in logs:
#    "Found user in AppUsers"
#    "Payment processing completed successfully"

# 4. Check user account for credit addition
```

---

## 📋 **CONFIGURATION REQUIREMENTS SUMMARY**

### **Zero Surgical Edits Required**
- ✅ **All file replacements are complete swaps**
- ✅ **No line-by-line editing needed**
- ✅ **No dependency changes required**
- ✅ **All imports remain the same**

### **Dependencies Already Available**
- ✅ Stripe SDK (already imported)
- ✅ AWS SDK (already imported)
- ✅ supabaseAuth (already imported)
- ✅ getCurrentUser (already imported)

### **Database Requirements**
- 🚨 **AppUsers EmailIndex GSI must be ACTIVE**
- 🚨 **Supabase users table must exist**
- 🚨 **Both databases must be accessible**

### **Environment Variables**
- 🚨 **STRIPE_WEBHOOK_SECRET is absolutely critical**
- 🚨 **SUPABASE_SERVICE_ROLE_KEY must have write permissions**
- 🚨 **AWS credentials must have DynamoDB query permissions**

---

## ⚡ **QUICK START DEPLOYMENT**

```bash
# Complete deployment in 4 commands:

# 1. Backup
mkdir backups && cp src/app/api/stripe/*.ts backups/

# 2. Replace checkout route
cp stripe-create-checkout-refactored.ts src/app/api/stripe/create-checkout/route.ts

# 3. Replace webhook route (TIME THIS CAREFULLY!)
cp stripe-webhook-refactored.ts src/app/api/stripe/webhook/route.ts

# 4. Verify deployment
curl -I https://yourdomain.com/api/stripe/webhook
```

**Total deployment time: < 30 seconds**
**Risk window: ~5 minutes** (until you verify webhooks work)

---

## 🎯 **SUCCESS CONFIRMATION**

After deployment, you should see:
```bash
# In webhook logs:
✅ "Found user in AppUsers: user@example.com (Status: active)"
✅ "Payment processing completed successfully"

# In Stripe Dashboard:
✅ Webhook delivery attempts showing 200 status
✅ No failed webhook deliveries

# In Supabase:
✅ User logo limits increasing after purchases
✅ No duplicate credit additions
```

**All artifacts are ready for clean file replacement with zero surgical edits required.**