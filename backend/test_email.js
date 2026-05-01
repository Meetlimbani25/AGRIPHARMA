require('dotenv').config();
const { sendOTPEmail } = require('./Utils/sendEmail');

async function test() {
  const result = await sendOTPEmail('meetlimbani25@gmail.com', '123456');
  console.log(result);
}

test();
