const axios = require('axios');

const sendOTPEmail = async (email, otp) => {
  try {
    const data = {
      sender: { name: "AgriPharma", email: "meetlimbani25@gmail.com" },
      to: [{ email: email }],
      subject: 'Password Reset OTP - AgriPharma',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #2E7D32;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP below to proceed.</p>
          <div style="margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; background: #f0f0f0; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ OTP email sent to ${email} via Brevo API`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email Sending Error:', err.response ? err.response.data : err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOTPEmail };
