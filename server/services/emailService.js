const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOtpEmail = async (toEmail, firstName, otpCode) => {
  const newHtmlBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          
          <tr>
              <td style="padding: 30px 30px 20px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #333; font-size: 24px; font-weight: bold;">
                      Finance Manager
                  </h1>
              </td>
          </tr>
          
          <tr>
              <td style="padding: 20px 30px 40px 30px;">
                  <p style="margin: 0 0 25px 0; font-size: 16px; color: #333;">
                      Hello ${firstName},
                  </p>
                  <p style="margin: 0 0 25px 0; font-size: 16px; color: #333;">
                      Your one-time password (OTP) is below. Please use it to complete your request.
                  </p>
                  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                      <tr>
                          <td align="center">
                              <div style="background-color: #f0f0f0; border-radius: 8px; padding: 15px 30px; border: 1px solid #ccc;">
                                  <p style="margin: 0; font-size: 32px; color: #000; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                                      ${otpCode}
                                  </p>
                              </div>
                          </td>
                      </tr>
                  </table>
                  
                  <p style="margin: 25px 0 25px 0; font-size: 16px; color: #333; text-align: center;">
                      This code will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="margin: 0; font-size: 16px; color: #555;">
                      If you did not request this code, please ignore this email or contact support.
                  </p>
              </td>
          </tr>
          
          <tr>
              <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                      &copy; 2025 Finance Manager. All rights reserved.
                  </p>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Your OTP Code - Finance Manager",
    text: `Hello ${firstName},\n\nYour OTP code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nFinance Manager Team`,
    html: newHtmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
    throw new Error("Email could not be sent");
  }
};

// TODO: Create a sendWelcomeEmail function
// TODO: Create a sendPasswordResetEmail function

module.exports = {
  sendOtpEmail,
};
