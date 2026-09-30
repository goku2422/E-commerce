const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runCancellationVerificationSuite() {
  console.log('🚀 Starting Post-Payment Order Cancellation Verification Suite...\n');

  const randomSuffix = Date.now();
  const customerAData = {
    name: `Cancel Customer A ${randomSuffix}`,
    email: `cancela_${randomSuffix}@test.com`,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: 'Password@123',
  };

  const customerBData = {
    name: `Cancel Customer B ${randomSuffix}`,
    email: `cancelb_${randomSuffix}@test.com`,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: 'Password@123',
  };

  // 1. Setup Accounts
  console.log('1️⃣ Registering Customer A & Customer B...');
  const regA = await axios.post(`${BASE_URL}/auth/register`, customerAData);
  const tokenA = regA.data.data.token;
  const userAId = regA.data.data._id;

  const regB = await axios.post(`${BASE_URL}/auth/register`, customerBData);
  const tokenB = regB.data.data.token;

  // Admin login
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@apexcart.com',
    password: 'Admin@123456',
  });
  const adminToken = adminLogin.data.data.token;
  console.log('   ✅ Accounts setup successfully.');

  // 2. Create product with initial Stock = 1
  console.log('\n2️⃣ Creating test product with Stock = 1 (as Admin)...');
  const catRes = await axios.get(`${BASE_URL}/categories`);
  const catId = catRes.data.data[0]._id;

  const prodRes = await axios.post(
    `${BASE_URL}/products`,
    {
      name: `Limited Edition Watch ${randomSuffix}`,
      description: 'Single item stock test product',
      price: 1000,
      discountPrice: 800,
      SKU: `SKU-CANCEL-${randomSuffix}`,
      stock: 1,
      category: catId,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const productId = prodRes.data.data._id;
  console.log(`   ✅ Test Product created (_id: ${productId}, Stock: 1)`);

  // 3. Customer A adds product to cart & adds delivery address
  console.log('\n3️⃣ Customer A adds product to cart & creates delivery address...');
  await axios.post(
    `${BASE_URL}/cart/items`,
    { productId, quantity: 1 },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );

  const addrRes = await axios.post(
    `${BASE_URL}/addresses`,
    {
      fullName: customerAData.name,
      mobile: customerAData.mobile,
      addressLine1: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      addressType: 'Home',
    },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const addressId = addrRes.data.data._id;

  // 4. Create Order & Simulate Successful Payment
  console.log('\n4️⃣ Creating Order & Verifying Payment (PAID)...');
  const createOrderRes = await axios.post(
    `${BASE_URL}/payments/create-order`,
    { addressId },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const orderId = createOrderRes.data.data.orderId;
  const razorpayOrderId = createOrderRes.data.data.razorpayOrderId;

  const verifyRes = await axios.post(
    `${BASE_URL}/payments/verify`,
    {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: `pay_test_${randomSuffix}`,
      razorpay_signature: 'mock_signature_valid',
    },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert.strictEqual(verifyRes.data.data.status, 'PLACED');
  assert.strictEqual(verifyRes.data.data.paymentInfo.status, 'PAID');

  // Check stock after payment: must be 0
  const prodCheck1 = await axios.get(`${BASE_URL}/products/${productId}`);
  assert.strictEqual(prodCheck1.data.data.stock, 0, 'Stock must be 0 after successful order payment');
  console.log('   ✅ Order PLACED & PAID. Product Stock reduced to 0.');

  // 5. Customer A Cancels Order
  console.log('\n5️⃣ Customer A cancels order...');
  const cancelRes = await axios.put(
    `${BASE_URL}/orders/${orderId}/cancel`,
    { reason: 'Changed mind' },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.data.data.status, 'CANCELLED');
  assert.strictEqual(cancelRes.data.data.paymentInfo.status, 'REFUNDED');
  assert.ok(cancelRes.data.data.paymentInfo.refundInfo, 'Refund transaction info must be present');
  assert.strictEqual(cancelRes.data.data.isInventoryRestored, true, 'isInventoryRestored flag must be true');

  // Check stock after cancellation: must be restored to 1
  const prodCheck2 = await axios.get(`${BASE_URL}/products/${productId}`);
  assert.strictEqual(prodCheck2.data.data.stock, 1, 'Stock must be restored to 1 after order cancellation');
  console.log('   ✅ Order CANCELLED, Payment REFUNDED, Refund info stored, Stock restored to 1.');

  // 6. Idempotency Check: Customer A attempts to cancel AGAIN
  console.log('\n6️⃣ Customer A attempts to cancel the SAME order again...');
  try {
    await axios.put(
      `${BASE_URL}/orders/${orderId}/cancel`,
      { reason: 'Cancel again' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert.fail('Cancelling an already cancelled order must throw HTTP 400 error');
  } catch (err) {
    assert.strictEqual(err.response.status, 400, 'Must return HTTP 400 on duplicate cancel attempt');
    console.log(`   ✅ Rejected duplicate cancellation attempt (${err.response.data.message})`);
  }

  // Verify stock remained = 1 (no double restoration)
  const prodCheck3 = await axios.get(`${BASE_URL}/products/${productId}`);
  assert.strictEqual(prodCheck3.data.data.stock, 1, 'Stock MUST remain = 1 after duplicate cancel attempt');
  console.log('   ✅ Stock verified: Remains exactly 1 (Zero double-inventory restoration).');

  // 7. Verify My Orders Visibility for Customer A
  console.log('\n7️⃣ Verifying Customer A My Orders list...');
  const myOrdersA = await axios.get(`${BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const foundInA = myOrdersA.data.data.orders.some((o) => o._id === orderId);
  assert.strictEqual(foundInA, true, 'Cancelled order MUST be visible in Customer A My Orders');
  console.log('   ✅ Cancelled order remains visible in Customer A My Orders');

  // 8. Verify Customer B Isolation in My Orders
  console.log('\n8️⃣ Verifying Customer B My Orders list...');
  const myOrdersB = await axios.get(`${BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const foundInB = myOrdersB.data.data.orders.some((o) => o._id === orderId);
  assert.strictEqual(foundInB, false, 'Cancelled order MUST NOT appear in Customer B My Orders');
  console.log('   ✅ Cancelled order does NOT appear in Customer B My Orders');

  // 9. Customer B attempts to cancel Customer A order
  console.log('\n9️⃣ Customer B attempts to cancel Customer A order...');
  try {
    await axios.put(
      `${BASE_URL}/orders/${orderId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert.fail('Customer B cancelling Customer A order must return 403 or 400');
  } catch (err) {
    assert.strictEqual(err.response.status, 403, 'Unauthorized cancel must return HTTP 403');
    console.log('   ✅ Customer B direct cancellation rejected with HTTP 403 Forbidden.');
  }

  // 10. Admin Orders List Check
  console.log('\n🔟 Verifying Admin Orders listing...');
  const adminOrders = await axios.get(`${BASE_URL}/orders/admin/all`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const foundInAdmin = adminOrders.data.data.orders.some((o) => o._id === orderId);
  assert.strictEqual(foundInAdmin, true, 'Cancelled order MUST remain visible in Admin order list');
  console.log('   ✅ Cancelled/Refunded order remains visible in Admin Orders list');

  console.log('\n🎉 ALL POST-PAYMENT ORDER CANCELLATION & REFUND ASSERTIONS PASSED PERFECTLY!\n');
}

runCancellationVerificationSuite().catch((err) => {
  console.error('❌ Cancellation Test failed:', err.message);
  if (err.response) {
    console.error('API Error Response:', err.response.data);
  }
  process.exit(1);
});
