const http = require('http');
const assert = require('assert');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runRazorpayMatrixVerification() {
  console.log('--- STARTING STRICT RAZORPAY TEST PAYMENT MATRIX SUITE ---');

  // 1. Customer Authentication Assertion
  console.log('\n1. Logging in Customer...');
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'customer@apexcart.com', password: 'Customer@123456' }
  );

  assert.strictEqual(loginRes.status, 200, 'Customer login failed');
  const token = loginRes.body.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('ASSERTION PASSED: Customer authenticated.');

  // 2. Prepare Cart & Address
  console.log('\n2. Preparing Cart & Delivery Address...');
  const prodRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: authHeaders });
  const product = prodRes.body.data.products.find((p) => p.stock > 0) || prodRes.body.data.products[0];

  await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/cart', method: 'DELETE', headers: authHeaders });
  await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/cart/items', method: 'POST', headers: authHeaders },
    { productId: product._id, quantity: 1 }
  );

  const addAddrRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/addresses', method: 'POST', headers: authHeaders },
    {
      fullName: 'Jane Matrix Test',
      mobile: '9876543210',
      addressLine1: '128 Matrix Way',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      addressType: 'Home',
    }
  );
  assert.strictEqual(addAddrRes.status, 201);
  const addressId = addAddrRes.body.data._id;
  console.log('ASSERTION PASSED: Cart and address prepared.');

  // 3. Create Order Assertion
  console.log('\n3. Testing POST /api/payments/create-order...');
  const createOrderRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: authHeaders },
    { addressId }
  );
  assert.strictEqual(createOrderRes.status, 200, 'Create payment order failed');
  const orderData = createOrderRes.body.data;
  assert.ok(orderData.orderId);
  assert.ok(orderData.razorpayOrderId);
  console.log(`ASSERTION PASSED: Created Order ID ${orderData.orderId} with Razorpay Order ID ${orderData.razorpayOrderId}.`);

  // 4. Verify Payment Assertion
  console.log('\n4. Testing POST /api/payments/verify (Successful Payment)...');
  const verifyRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/verify', method: 'POST', headers: authHeaders },
    {
      razorpay_order_id: orderData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_' + Date.now(),
      razorpay_signature: 'mock_signature',
      orderId: orderData.orderId,
    }
  );
  assert.strictEqual(verifyRes.status, 200, 'Payment verification failed');
  assert.strictEqual(verifyRes.body.data?.paymentInfo?.status, 'PAID', 'Order paymentInfo status must be PAID');
  console.log('ASSERTION PASSED: Payment verified; Order and Payment records updated to PAID.');

  // 5. Idempotency Assertion (Duplicate Verification Request)
  console.log('\n5. Testing Duplicate Verification Request (Idempotency)...');
  const dupVerifyRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/verify', method: 'POST', headers: authHeaders },
    {
      razorpay_order_id: orderData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_' + Date.now(),
      razorpay_signature: 'mock_signature',
      orderId: orderData.orderId,
    }
  );
  assert.strictEqual(dupVerifyRes.status, 200, 'Idempotent duplicate check failed');
  assert.ok(dupVerifyRes.body.message.includes('already verified'), 'Should recognize already verified payment');
  console.log('ASSERTION PASSED: Duplicate verification request handled idempotently.');

  // 6. Fail-Closed Signature Validation Assertion
  console.log('\n6. Testing Invalid Signature Fail-Closed Handling...');
  const prodRes2 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: authHeaders });
  const inStockProd = prodRes2.body.data.products.find((p) => p.stock > 0) || product;

  await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/cart/items', method: 'POST', headers: authHeaders },
    { productId: inStockProd._id, quantity: 1 }
  );
  const createOrderRes2 = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: authHeaders },
    { addressId }
  );
  const orderData2 = createOrderRes2.body.data;

  // Temporarily set real key secret in env to test HMAC verification rejection
  process.env.RAZORPAY_KEY_SECRET = 'live_secret_key_98765';
  const invalidSigRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/verify', method: 'POST', headers: authHeaders },
    {
      razorpay_order_id: orderData2.razorpayOrderId,
      razorpay_payment_id: 'pay_test_invalid',
      razorpay_signature: 'invalid_sha256_signature_string',
      orderId: orderData2.orderId,
    }
  );
  process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_key_secret';

  assert.strictEqual(invalidSigRes.status, 400, 'Invalid signature MUST return HTTP 400');
  assert.strictEqual(invalidSigRes.body.success, false, 'Invalid signature MUST set success: false');
  console.log('ASSERTION PASSED: Invalid signature returned HTTP 400 and failed closed.');

  console.log('\n==================================================');
  console.log('ALL RAZORPAY MATRIX ASSERTIONS PASSED (100% VERIFIED)');
  console.log('==================================================');
}

runRazorpayMatrixVerification().catch((err) => {
  console.error('Strict Razorpay Matrix Assertion Error:', err);
  process.exit(1);
});
