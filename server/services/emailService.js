const axios = require("axios");

const sendOtpEmail = async (toEmail, firstName, otpCode) => {
  const data = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_FINANCE_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY, // Set this in Render Env
    template_params: {
      to_email: toEmail, // Matches {{to_email}} in Dashboard
      first_name: firstName, // Matches {{first_name}} in HTML
      otp_code: otpCode, // Matches {{otp_code}} in HTML
    },
  };

  try {
    await axios.post("https://api.emailjs.com/api/v1.0/email/send", data);
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(
      "EmailJS Error:",
      error.response ? error.response.data : error.message,
    );
    throw new Error("Email could not be sent");
  }
};

module.exports = {
  sendOtpEmail,
};
