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

async function runCheckoutVerification() {
  console.log('--- STARTING STRICT CHECKOUT INTEGRATION TEST SUITE ---');

  // 1. Customer Login Assertion
  console.log('\n1. Logging in Customer (customer@apexcart.com)...');
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
  assert.ok(loginRes.body.data?.token, 'JWT token missing');
  const token = loginRes.body.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('ASSERTION PASSED: Customer logged in successfully.');

  // 2. Product Catalog Fetch Assertion
  console.log('\n2. Fetching products from catalog...');
  const prodRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(prodRes.status, 200);
  const products = prodRes.body.data?.products || [];
  assert.ok(products.length > 0, 'No products found in catalog');
  console.log(`ASSERTION PASSED: Catalog returned ${products.length} active products.`);

  const cheapProduct = products.find((p) => p.price < 999) || products[0];
  const expensiveProduct = products.find((p) => p.price >= 999) || products[0];

  // 3. Clear Cart & Add Item
  console.log(`\n3. Testing Cart Subtotal Below Threshold (${cheapProduct.name})...`);
  await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/cart', method: 'DELETE', headers: authHeaders });
  const addToCartRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/cart/items', method: 'POST', headers: authHeaders },
    { productId: cheapProduct._id, quantity: 1 }
  );
  assert.strictEqual(addToCartRes.status, 200, 'Add to cart failed');

  const belowRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/checkout/summary',
    method: 'POST',
    headers: authHeaders,
  });
  assert.strictEqual(belowRes.status, 200, 'Checkout summary failed');
  const summaryBelow = belowRes.body.data;

  assert.ok(typeof summaryBelow.subtotal === 'number', 'subtotal must be a number');
  assert.ok(typeof summaryBelow.deliveryFee === 'number', 'deliveryFee must be a number');
  assert.ok(typeof summaryBelow.totalPayable === 'number', 'totalPayable must be a number');
  assert.strictEqual(summaryBelow.deliveryFee, 50, 'Standard delivery fee below free threshold must be ₹50');
  console.log('ASSERTION PASSED: Subtotal below threshold calculated delivery fee ₹50 correctly.');

  // 4. Add Address Assertion
  console.log('\n4. Testing Adding Delivery Address via API...');
  const addAddrRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/addresses',
      method: 'POST',
      headers: authHeaders,
    },
    {
      fullName: 'John Customer',
      mobile: '9123456789',
      addressLine1: '42 Silicon Avenue, Tech Park',
      addressLine2: 'Block B, Suite 101',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      addressType: 'Home',
    }
  );
  assert.strictEqual(addAddrRes.status, 201, 'Add address failed');
  const createdAddressId = addAddrRes.body.data?._id;
  assert.ok(createdAddressId, 'Created address ID missing');
  console.log('ASSERTION PASSED: Delivery address created and saved to MongoDB.');

  // 5. Test Free Delivery Threshold Assertion
  console.log(`\n5. Testing Free Delivery Threshold (${expensiveProduct.name})...`);
  await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/cart/items', method: 'POST', headers: authHeaders },
    { productId: expensiveProduct._id, quantity: 1 }
  );

  const aboveRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/checkout/summary', method: 'POST', headers: authHeaders },
    { addressId: createdAddressId }
  );
  assert.strictEqual(aboveRes.status, 200);
  const summaryAbove = aboveRes.body.data;
  assert.strictEqual(summaryAbove.isFreeDelivery, true, 'isFreeDelivery should be true for subtotals >= ₹999');
  assert.strictEqual(summaryAbove.deliveryFee, 0, 'deliveryFee should be 0 when free threshold is met');
  console.log('ASSERTION PASSED: Subtotal >= ₹999 correctly triggered FREE delivery.');

  // 6. Test Coupon Application Assertion
  console.log('\n6. Testing Coupon Code Application (WELCOME10)...');
  const couponRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/checkout/summary', method: 'POST', headers: authHeaders },
    { addressId: createdAddressId, couponCode: 'WELCOME10' }
  );
  assert.strictEqual(couponRes.status, 200);
  const summaryCoupon = couponRes.body.data;
  assert.ok(summaryCoupon.discount > 0, 'Discount must be greater than 0');
  assert.strictEqual(summaryCoupon.couponApplied.code, 'WELCOME10');
  console.log(`ASSERTION PASSED: Coupon WELCOME10 applied discount of ₹${summaryCoupon.discount}.`);

  // 7. Test Razorpay Order Creation Assertion
  console.log('\n7. Testing Razorpay Order Creation (/api/payments/create-order)...');
  const orderInitRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: authHeaders },
    { addressId: createdAddressId, couponCode: 'WELCOME10' }
  );
  assert.strictEqual(orderInitRes.status, 200, 'Create order failed');
  const orderData = orderInitRes.body.data;
  assert.ok(orderData.orderId, 'Order ID missing');
  assert.ok(orderData.razorpayOrderId, 'Razorpay order ID missing');
  assert.ok(orderData.amountInPaise > 0, 'Amount in paise must be positive integer');
  console.log(`ASSERTION PASSED: Created order #${orderData.orderNumber} with amountInPaise ${orderData.amountInPaise}.`);

  console.log('\n==================================================');
  console.log('ALL CHECKOUT ASSERTIONS PASSED (100% VERIFIED)');
  console.log('==================================================');
}

runCheckoutVerification().catch((err) => {
  console.error('Strict Checkout Assertion Error:', err);
  process.exit(1);
});
