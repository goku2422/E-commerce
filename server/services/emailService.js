const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Transporter configuration from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const sendOrderNotification = async ({ userId, userEmail, userName, orderNumber, type, title, message, orderId }) => {
  try {
    // 1. Create in-app DB notification
    if (userId) {
      await Notification.create({
        user: userId,
        title,
        message,
        order: orderId,
        type,
      });
    }

    // 2. Email log / send simulation
    if (userEmail && process.env.SMTP_USER) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"ApexCart Support" <noreply@apexcart.com>',
        to: userEmail,
        subject: `ApexCart Notification: ${title} [${orderNumber || ''}]`,
        text: `Hello ${userName || 'Customer'},\n\n${message}\n\nThank you for shopping with ApexCart!`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email notification sent to ${userEmail} for event ${type}`);
    } else {
      console.log(`[Notification Sim] User: ${userEmail || userId} | Event: ${type} | Message: ${message}`);
    }
  } catch (error) {
    console.error('Error in sendOrderNotification service:', error.message);
  }
};

module.exports = { sendOrderNotification };
