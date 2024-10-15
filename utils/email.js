const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transportOptions = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  const transporter = nodemailer.createTransport(transportOptions);

  // define email options
  const mailOptions = {
    from: 'Natours app <natours@mail.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // send email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
