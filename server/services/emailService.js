const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, firstName, otpCode) => {
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-R">
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
                        Your one-time password (OTP) is below.
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

  try {
    const { data, error } = await resend.emails.send({
      from: "Finance Manager <onboarding@resend.dev>",
      to: [toEmail],
      subject: "Your OTP Code - Finance Manager",
      html: htmlBody,
    });

    if (error) {
      console.error(`Error sending email to ${toEmail}:`, error);
      throw new Error("Email could not be sent");
    }

    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
    throw new Error("Email could not be sent");
  }
};

module.exports = {
  sendOtpEmail,
};
