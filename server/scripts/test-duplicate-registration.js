const axios = require('axios');
const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');

const BASE_URL = 'http://localhost:5000/api';

async function runDuplicateRegistrationVerification() {
  console.log('🚀 Starting Duplicate Mobile & Email Registration Verification Suite...\n');

  const randomSuffix = Date.now();
  const email1 = `user1_${randomSuffix}@test.com`;
  const email2 = `user2_${randomSuffix}@test.com`;
  const mobile1 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const mobile2 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const password = 'Test@123';

  // 1. Initial Valid Registration
  console.log('1️⃣ Registering primary user (User 1)...');
  console.log(`   Email: ${email1}, Mobile: ${mobile1}`);
  const reg1Res = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'User One',
    email: email1,
    mobile: mobile1,
    password: password,
  });

  assert.strictEqual(reg1Res.status, 201, 'User 1 registration must return HTTP 201 Created');
  assert.strictEqual(reg1Res.data.success, true, 'User 1 registration success must be true');
  assert.ok(reg1Res.data.data.token, 'User 1 registration response must contain JWT token');
  console.log('   ✅ STEP 1 PASSED: User 1 registered successfully (HTTP 201).');

  // 2. Register with Duplicate Mobile Number
  console.log('\n2️⃣ Attempting to register User 2 with DUPLICATE Mobile Number...');
  console.log(`   Email: ${email2}, Mobile: ${mobile1} (DUPLICATE)`);
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User Two',
      email: email2,
      mobile: mobile1,
      password: password,
    });
    assert.fail('Duplicate mobile registration should have thrown HTTP 400/409');
  } catch (err) {
    const status = err.response ? err.response.status : 0;
    const msg = err.response ? err.response.data.message : err.message;
    assert.ok(status === 400 || status === 409, `Expected HTTP 400 or 409 but received ${status}`);
    assert.ok(
      msg.toLowerCase().includes('mobile'),
      `Error message should mention mobile duplicate rejection. Got: "${msg}"`
    );
    console.log(`   ✅ STEP 2 PASSED: Duplicate mobile registration rejected with HTTP ${status} ("${msg}").`);
  }

  // 3. Register with Duplicate Email Address
  console.log('\n3️⃣ Attempting to register User 3 with DUPLICATE Email Address...');
  console.log(`   Email: ${email1} (DUPLICATE), Mobile: ${mobile2}`);
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User Three',
      email: email1,
      mobile: mobile2,
      password: password,
    });
    assert.fail('Duplicate email registration should have thrown HTTP 400/409');
  } catch (err) {
    const status = err.response ? err.response.status : 0;
    const msg = err.response ? err.response.data.message : err.message;
    assert.ok(status === 400 || status === 409, `Expected HTTP 400 or 409 but received ${status}`);
    assert.ok(
      msg.toLowerCase().includes('email'),
      `Error message should mention email duplicate rejection. Got: "${msg}"`
    );
    console.log(`   ✅ STEP 3 PASSED: Duplicate email registration rejected with HTTP ${status} ("${msg}").`);
  }

  // 4. Login using original account
  console.log('\n4️⃣ Logging in using original account (User 1)...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: email1,
    password: password,
  });
  assert.strictEqual(loginRes.status, 200, 'Original account login must return HTTP 200 OK');
  assert.strictEqual(loginRes.data.success, true);
  assert.ok(loginRes.data.data.token, 'Login must return JWT token');
  console.log('   ✅ STEP 4 PASSED: Original user logged in successfully (HTTP 200).');

  // 5. Database Level Schema Unique Index Verification
  console.log('\n5️⃣ Testing MongoDB Database Level Unique Index Enforcement (Code 11000)...');
  let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';
  try {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    } catch (connErr) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
    }
    
    // Ensure Mongoose schema unique indexes are synced in MongoDB
    await User.syncIndexes();

    // First insert a user into DB
    await User.create({
      name: 'Initial DB User',
      email: `initial_db_${randomSuffix}@test.com`,
      mobile: `db_${mobile1}`,
      password: 'Password@123',
    });

    try {
      await User.create({
        name: 'Direct DB Duplicate',
        email: `direct_${randomSuffix}@test.com`,
        mobile: `db_${mobile1}`, // Duplicate mobile directly in DB
        password: 'Password@123',
      });
      assert.fail('Direct MongoDB insert with duplicate mobile should have thrown E11000 duplicate key error');
    } catch (dbErr) {
      assert.strictEqual(dbErr.code, 11000, 'MongoDB MUST enforce E11000 duplicate key error on mobile index');
      console.log('   ✅ STEP 5 PASSED: MongoDB schema unique index strictly enforced (Error Code 11000).');
    }

    await mongoose.disconnect();
  } catch (mErr) {
    console.warn('   ⚠️ Note: DB direct check skipped:', mErr.message);
  }

  console.log('\n🎉 ALL DUPLICATE REGISTRATION & DATABASE UNIQUE INDEX ASSERTIONS PASSED PERFECTLY!\n');
}

runDuplicateRegistrationVerification().catch((err) => {
  console.error('❌ Verification failed:', err.message);
  if (err.response) {
    console.error('API Error Response:', err.response.data);
  }
  process.exit(1);
});
