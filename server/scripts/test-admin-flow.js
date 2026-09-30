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

async function runAdminVerification() {
  console.log('--- STARTING STRICT ADMIN API INTEGRATION TEST SUITE ---');

  // 1. Admin Login Assertion
  console.log('\n1. Testing Admin Login (/api/auth/login)...');
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@apexcart.com', password: 'Admin@123456' }
  );

  assert.strictEqual(loginRes.status, 200, 'Admin login failed - Expected HTTP 200');
  assert.ok(loginRes.body.data?.token, 'Admin login token missing from response');
  const token = loginRes.body.data.token;
  console.log('ASSERTION PASSED: Admin Login returned HTTP 200 and valid JWT token.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Control Dashboard Assertion
  console.log('\n2. Testing Admin Dashboard API (/api/admin/dashboard)...');
  const dashRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(dashRes.status, 200, 'Admin dashboard failed - Expected HTTP 200');
  assert.strictEqual(dashRes.body.success, true);
  assert.ok(dashRes.body.data.totalProducts !== undefined, 'totalProducts metric missing');
  console.log('ASSERTION PASSED: Dashboard returned HTTP 200 with dynamic metrics.');

  // 3. Admin Products (Including Disabled) Assertion
  console.log('\n3. Testing Admin Products API (/api/admin/products)...');
  const prodRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/products?limit=10',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(prodRes.status, 200, 'Admin products listing failed - Expected HTTP 200');
  assert.ok(Array.isArray(prodRes.body.data?.products), 'Products array missing');
  console.log(`ASSERTION PASSED: Admin Products API returned HTTP 200 with ${prodRes.body.data.products.length} products.`);

  // 4. Product Creation Assertion
  console.log('\n4. Testing Product Creation (/api/products)...');
  const catRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/categories',
    method: 'GET',
    headers: authHeaders,
  });
  const catId = catRes.body.data?.[0]?._id;

  const createProdRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'POST',
      headers: authHeaders,
    },
    {
      name: 'Assertion Test Product ' + Date.now(),
      SKU: 'TST-' + Math.floor(Math.random() * 100000),
      price: 2999,
      discountPrice: 2499,
      stock: 10,
      category: catId,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
      description: 'Strict integration test item',
      isEnabled: true,
    }
  );
  assert.strictEqual(createProdRes.status, 201, 'Product creation failed - Expected HTTP 201');
  const createdProdId = createProdRes.body.data?._id;
  assert.ok(createdProdId, 'Created product ID missing');
  console.log('ASSERTION PASSED: Product Created with HTTP 201.');

  // 5. Product Status Toggle Assertion
  console.log(`\n5. Testing Product Toggle Status (/api/products/${createdProdId}/toggle-status)...`);
  const toggleRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/products/${createdProdId}/toggle-status`,
    method: 'PATCH',
    headers: authHeaders,
  });
  assert.strictEqual(toggleRes.status, 200, 'Toggle product status failed - Expected HTTP 200');
  assert.strictEqual(toggleRes.body.data?.isEnabled, false, 'Product should be disabled after toggle');
  console.log('ASSERTION PASSED: Product disabled successfully via admin toggle endpoint.');

  // 6. Product Deletion Assertion
  console.log(`\n6. Testing Product Deletion (/api/products/${createdProdId})...`);
  const delProdRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/products/${createdProdId}`,
    method: 'DELETE',
    headers: authHeaders,
  });
  assert.strictEqual(delProdRes.status, 200, 'Product deletion failed - Expected HTTP 200');
  console.log('ASSERTION PASSED: Product deleted successfully.');

  // 7. Orders Listing Assertion
  console.log('\n7. Testing Admin Orders Listing (/api/orders/admin/all)...');
  const ordersRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/admin/all',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(ordersRes.status, 200, 'Admin orders failed - Expected HTTP 200');
  console.log('ASSERTION PASSED: Admin Orders API returned HTTP 200.');

  // 8. Customers Listing Assertion
  console.log('\n8. Testing Admin Customers API (/api/admin/users)...');
  const usersRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(usersRes.status, 200, 'Admin users failed - Expected HTTP 200');
  console.log('ASSERTION PASSED: Admin Users API returned HTTP 200.');

  // 9. Delivery Config Assertion
  console.log('\n9. Testing Delivery Config API (/api/admin/delivery-config)...');
  const delivRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/delivery-config',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(delivRes.status, 200, 'Delivery config failed - Expected HTTP 200');
  assert.ok(delivRes.body.data?.minAmountForFreeDelivery !== undefined, 'minAmountForFreeDelivery missing');
  console.log('ASSERTION PASSED: Delivery Config returned HTTP 200.');

  // 10. Payments Audit Assertion
  console.log('\n10. Testing Payments Audit API (/api/admin/payments)...');
  const payRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/payments',
    method: 'GET',
    headers: authHeaders,
  });
  assert.strictEqual(payRes.status, 200, 'Payments audit failed - Expected HTTP 200');
  console.log('ASSERTION PASSED: Payments Audit API returned HTTP 200.');

  console.log('\n==================================================');
  console.log('ALL STRICT ADMIN ASSERTIONS PASSED (100% VERIFIED)');
  console.log('==================================================');
}

runAdminVerification().catch((err) => {
  console.error('Strict Admin Assertion Error:', err);
  process.exit(1);
});
