const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runAuthPersistenceTests() {
  console.log('🚀 Starting Auth Persistence & Session Isolation Verification Suite...\n');

  const randomSuffix = Date.now();
  const userAData = {
    name: `Test User A ${randomSuffix}`,
    email: `usera_${randomSuffix}@test.com`,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: 'Password@123',
  };

  const userBData = {
    name: `Test User B ${randomSuffix}`,
    email: `userb_${randomSuffix}@test.com`,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: 'Password@123',
  };

  // 1. Register User A
  console.log('1️⃣ Registering User A...');
  const regResA = await axios.post(`${BASE_URL}/auth/register`, userAData);
  assert.strictEqual(regResA.status, 201, 'User A registration should return HTTP 201');
  assert.strictEqual(regResA.data.success, true, 'User A registration success should be true');
  const tokenA = regResA.data.data.token;
  const idA = regResA.data.data._id;
  assert.ok(tokenA, 'User A response must contain JWT token');
  assert.ok(idA, 'User A response must contain _id');
  console.log(`   ✅ User A registered successfully (_id: ${idA})`);

  // 2. Simulate Page Refresh / Initial Load by fetching Profile for User A
  console.log('\n2️⃣ Simulating Page Refresh & Token Verification for User A...');
  const profileResA = await axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(profileResA.status, 200, 'Profile fetch should return HTTP 200');
  assert.strictEqual(profileResA.data.data._id, idA, 'Profile _id must match User A _id');
  assert.strictEqual(profileResA.data.data.email, userAData.email.toLowerCase(), 'Profile email must match User A email');
  console.log('   ✅ Profile fetch verified User A session correctly');

  // 3. Update Profile for User A and verify token preservation
  console.log('\n3️⃣ Updating User A profile...');
  const updateResA = await axios.put(
    `${BASE_URL}/auth/profile`,
    { name: `Updated Name ${randomSuffix}`, mobile: userAData.mobile },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert.strictEqual(updateResA.status, 200, 'Profile update should return HTTP 200');
  assert.strictEqual(updateResA.data.data.name, `Updated Name ${randomSuffix}`, 'Name should be updated');
  
  // Re-verify profile fetch with existing token
  const reProfileA = await axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(reProfileA.data.data.name, `Updated Name ${randomSuffix}`);
  console.log('   ✅ User A profile updated & token remains valid for subsequent calls');

  // 4. Register User B & Verify User Isolation
  console.log('\n4️⃣ Registering User B & testing Customer Isolation...');
  const regResB = await axios.post(`${BASE_URL}/auth/register`, userBData);
  assert.strictEqual(regResB.status, 201);
  const tokenB = regResB.data.data.token;
  const idB = regResB.data.data._id;
  assert.notStrictEqual(idA, idB, 'User A and User B must have different _ids');

  const profileResB = await axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(profileResB.data.data._id, idB);
  assert.notStrictEqual(profileResB.data.data._id, idA);
  console.log(`   ✅ User B session isolate verified (_id: ${idB})`);

  // 5. Verify Invalid / Expired Token returns 401
  console.log('\n5️⃣ Testing Invalid Token response...');
  try {
    await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: 'Bearer invalid_dummy_token_123' },
    });
    assert.fail('Invalid token should have thrown HTTP 401 error');
  } catch (err) {
    assert.strictEqual(err.response.status, 401, 'Invalid token must return HTTP 401');
    console.log('   ✅ Invalid token properly rejected with HTTP 401');
  }

  console.log('\n🎉 ALL AUTH PERSISTENCE & ISOLATION TESTS PASSED PERFECTLY!\n');
}

runAuthPersistenceTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  if (err.response) {
    console.error('API Error Response:', err.response.data);
  }
  process.exit(1);
});
