const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');

// Ensure environment variables are loaded if not already loaded
if (!process.env.RAZORPAY_KEY_ID) {
  const serverEnv = path.resolve(__dirname, '../.env');
  const rootEnv = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
  } else if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  } else {
    dotenv.config();
  }
}

let razorpayInstance = null;

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || !key_id.trim() || !key_secret.trim()) {
    throw new Error('Razorpay API credentials are not properly configured in server/.env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

module.exports = { getRazorpayInstance };
