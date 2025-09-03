// src/app/utils/webhook-test-utility.ts
// Simple utility to test the new Stripe webhook without backward compatibility

import crypto from 'crypto';

interface TestWebhookPayload {
    userEmail: string;
    appId: string;
    quantity: number;
    sessionId?: string;
}

interface WebhookTestResult {
    success: boolean;
    message: string;
    details?: any;
}

export class WebhookTester {
    private webhookSecret: string;
    private webhookUrl: string;

    constructor(webhookSecret: string, webhookUrl: string) {
        this.webhookSecret = webhookSecret;
        this.webhookUrl = webhookUrl;
    }

    /**
     * Create a valid Stripe webhook signature for testing
     */
    private createStripeSignature(payload: string, timestamp: number): string {
        const payloadString = `${timestamp}.${payload}`;
        const signature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payloadString)
            .digest('hex');

        return `t=${timestamp},v1=${signature}`;
    }

    /**
     * Create a test webhook payload with new metadata format
     */
    private createTestPayload(testData: TestWebhookPayload): any {
        return {
            id: 'evt_test_webhook',
            object: 'event',
            type: 'checkout.session.completed',
            created: Math.floor(Date.now() / 1000),
            data: {
                object: {
                    id: testData.sessionId || `cs_test_${Date.now()}`,
                    object: 'checkout.session',
                    payment_status: 'paid',
                    customer_email: testData.userEmail,
                    metadata: {
                        userEmail: testData.userEmail,
                        appId: testData.appId,
                        quantity: testData.quantity.toString()
                    }
                }
            }
        };
    }

    /**
     * Test the webhook with valid new metadata format
     */
    async testValidPayment(testData: TestWebhookPayload): Promise<WebhookTestResult> {
        try {
            console.log(`🧪 Testing webhook with: ${testData.userEmail}, ${testData.quantity} credits`);

            const payload = this.createTestPayload(testData);
            const payloadString = JSON.stringify(payload);
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = this.createStripeSignature(payloadString, timestamp);

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': signature
                },
                body: payloadString
            });

            const responseText = await response.text();

            if (response.ok) {
                return {
                    success: true,
                    message: `✅ Payment processed successfully for ${testData.userEmail}`,
                    details: { status: response.status, body: responseText }
                };
            } else {
                return {
                    success: false,
                    message: `❌ Webhook failed with status ${response.status}`,
                    details: { status: response.status, body: responseText }
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `❌ Network error testing webhook`,
                details: error
            };
        }
    }

    /**
     * Test webhook with missing metadata (should fail)
     */
    async testMissingMetadata(): Promise<WebhookTestResult> {
        try {
            console.log(`🧪 Testing webhook with missing metadata (should fail)`);

            const payload = {
                id: 'evt_test_webhook',
                object: 'event',
                type: 'checkout.session.completed',
                created: Math.floor(Date.now() / 1000),
                data: {
                    object: {
                        id: `cs_test_${Date.now()}`,
                        object: 'checkout.session',
                        payment_status: 'paid',
                        metadata: {
                            // Missing userEmail, appId, and quantity
                        }
                    }
                }
            };

            const payloadString = JSON.stringify(payload);
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = this.createStripeSignature(payloadString, timestamp);

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': signature
                },
                body: payloadString
            });

            const responseText = await response.text();

            if (response.status === 400) {
                return {
                    success: true, // This should fail with 400
                    message: `✅ Correctly rejected missing metadata (status 400)`,
                    details: { status: response.status, body: responseText }
                };
            } else {
                return {
                    success: false,
                    message: `❌ Should have rejected missing metadata but got status ${response.status}`,
                    details: { status: response.status, body: responseText }
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `❌ Network error testing missing metadata`,
                details: error
            };
        }
    }

    /**
     * Test webhook with old metadata format (should fail - no backward compatibility)
     */
    async testLegacyMetadata(): Promise<WebhookTestResult> {
        try {
            console.log(`🧪 Testing webhook with legacy metadata (should fail)`);

            const payload = {
                id: 'evt_test_webhook',
                object: 'event',
                type: 'checkout.session.completed',
                created: Math.floor(Date.now() / 1000),
                data: {
                    object: {
                        id: `cs_test_${Date.now()}`,
                        object: 'checkout.session',
                        payment_status: 'paid',
                        metadata: {
                            // Old format that should fail
                            userId: '123',
                            quantity: '5'
                        }
                    }
                }
            };

            const payloadString = JSON.stringify(payload);
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = this.createStripeSignature(payloadString, timestamp);

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': signature
                },
                body: payloadString
            });

            const responseText = await response.text();

            if (response.status === 400) {
                return {
                    success: true, // This should fail with 400
                    message: `✅ Correctly rejected legacy metadata (status 400)`,
                    details: { status: response.status, body: responseText }
                };
            } else {
                return {
                    success: false,
                    message: `❌ Should have rejected legacy metadata but got status ${response.status}`,
                    details: { status: response.status, body: responseText }
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `❌ Network error testing legacy metadata`,
                details: error
            };
        }
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<void> {
        console.log('🚀 Starting webhook tests (No Backward Compatibility)...\n');

        // Test 1: Valid payment
        const validTest = await this.testValidPayment({
            userEmail: 'test@example.com',
            appId: 'logo-generator',
            quantity: 5
        });
        console.log(validTest.message);
        if (validTest.details) console.log('  Details:', validTest.details);
        console.log();

        // Test 2: Missing metadata
        const missingTest = await this.testMissingMetadata();
        console.log(missingTest.message);
        if (missingTest.details) console.log('  Details:', missingTest.details);
        console.log();

        // Test 3: Legacy metadata
        const legacyTest = await this.testLegacyMetadata();
        console.log(legacyTest.message);
        if (legacyTest.details) console.log('  Details:', legacyTest.details);
        console.log();

        // Summary
        const allPassed = validTest.success && missingTest.success && legacyTest.success;
        console.log(`🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

        if (allPassed) {
            console.log('✅ Webhook is ready for production deployment!');
        } else {
            console.log('❌ Fix issues before deploying to production!');
        }
    }
}

// Usage example
async function runTests() {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test...';
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';

    const tester = new WebhookTester(webhookSecret, webhookUrl);
    await tester.runAllTests();
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

export default WebhookTester;