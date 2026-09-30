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

async function runMyOrdersVerification() {
  console.log('--- STARTING MY ORDERS END-TO-END FLOW VERIFICATION ---');

  // Step 1: Customer A Login
  console.log('\n1. Logging in Customer A (customer@apexcart.com)...');
  const loginResA = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'customer@apexcart.com', password: 'Customer@123456' }
  );

  assert.strictEqual(loginResA.status, 200, 'Customer A login failed');
  const tokenA = loginResA.body.data.token;
  const customerA_id = loginResA.body.data._id;
  const headersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` };
  console.log(`ASSERTION PASSED: Customer A authenticated (User ID: ${customerA_id}).`);

  // Step 2: Add Product & Create Address
  console.log('\n2. Adding product & preparing delivery address...');
  const prodRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: headersA });
  const product = prodRes.body.data.products[0];

  await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/cart', method: 'DELETE', headers: headersA });
  await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/cart/items', method: 'POST', headers: headersA },
    { productId: product._id, quantity: 1 }
  );

  const addAddrRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/addresses', method: 'POST', headers: headersA },
    {
      fullName: 'John Customer A',
      mobile: '9876543210',
      addressLine1: '100 Innovation Way',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      addressType: 'Home',
    }
  );
  const addressId = addAddrRes.body.data._id;

  // Step 3: Create Order & Verify Payment
  console.log('\n3. Placing Order & Verifying Payment...');
  const orderInitRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: headersA },
    { addressId }
  );
  assert.strictEqual(orderInitRes.status, 200);
  const orderData = orderInitRes.body.data;
  const orderIdA = orderData.orderId;

  const verifyRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/payments/verify', method: 'POST', headers: headersA },
    {
      razorpay_order_id: orderData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_' + Date.now(),
      razorpay_signature: 'sig_test_' + Date.now(),
      orderId: orderIdA,
    }
  );
  assert.strictEqual(verifyRes.status, 200);
  console.log(`ASSERTION PASSED: Order #${orderData.orderNumber} placed & payment verified.`);

  // Step 4: Verify Order Appears in GET /api/orders/my-orders for Customer A
  console.log('\n4. Testing GET /api/orders/my-orders for Customer A...');
  const myOrdersResA = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/my-orders',
    method: 'GET',
    headers: headersA,
  });

  assert.strictEqual(myOrdersResA.status, 200, 'GET my-orders failed');
  const ordersA = myOrdersResA.body.data?.orders || myOrdersResA.body.orders || [];
  assert.ok(Array.isArray(ordersA), 'Orders list must be an array');
  assert.ok(ordersA.length > 0, 'My Orders list must not be empty');

  const foundOrderA = ordersA.find((o) => o._id.toString() === orderIdA.toString());
  assert.ok(foundOrderA, `Newly placed order ID ${orderIdA} MUST appear in Customer A's My Orders`);
  assert.strictEqual(foundOrderA.customer.toString(), customerA_id.toString(), 'Order customer ID must match logged-in Customer A');
  console.log(`ASSERTION PASSED: Order #${foundOrderA.orderNumber} visibly returned in Customer A's My Orders!`);

  // Step 5: Test Customer B Isolation (Security Requirement)
  console.log('\n5. Testing Customer B Data Isolation...');
  // Register or Login Customer B
  let tokenB, customerB_id;
  const loginResB = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'customerB@apexcart.com', password: 'CustomerB@123456' }
  );

  if (loginResB.status === 200) {
    tokenB = loginResB.body.data.token;
    customerB_id = loginResB.body.data._id;
  } else {
    const regResB = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Customer B', email: 'customerB@apexcart.com', mobile: '9988776655', password: 'CustomerB@123456' }
    );
    tokenB = regResB.body.data.token;
    customerB_id = regResB.body.data._id;
  }

  const headersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` };

  // Customer B checks My Orders
  const myOrdersResB = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/my-orders',
    method: 'GET',
    headers: headersB,
  });
  const ordersB = myOrdersResB.body.data?.orders || myOrdersResB.body.orders || [];
  const foundCustomerAOrderInB = ordersB.find((o) => o._id.toString() === orderIdA.toString());
  assert.strictEqual(foundCustomerAOrderInB, undefined, "Customer B MUST NOT see Customer A's order in My Orders!");
  console.log("ASSERTION PASSED: Customer B cannot see Customer A's orders in list.");

  // Customer B attempts to access Customer A's Order Details directly
  console.log('\n6. Testing Customer B Attempting Direct Access to Customer A Order...');
  const directAccessResB = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${orderIdA}`,
    method: 'GET',
    headers: headersB,
  });
  assert.strictEqual(directAccessResB.status, 403, 'Customer B direct access MUST be rejected with HTTP 403 Forbidden');
  console.log('ASSERTION PASSED: Direct order access for non-owner returned HTTP 403 Forbidden.');

  console.log('\n==================================================');
  console.log('MY ORDERS FLOW & SECURITY ISOLATION 100% VERIFIED');
  console.log('==================================================');
}

runMyOrdersVerification().catch((err) => {
  console.error('My Orders Verification Error:', err);
  process.exit(1);
});
