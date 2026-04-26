const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - AgriPharma',
      html: `
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} | Message ID: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email Sending Error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOTPEmail };
