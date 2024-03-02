const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_EMAIL_PASS,
  },
});

const sentOtpToUserEmail = async (email, otp) => {
  try {
    const mailOption = {
      from: process.env.OTP_EMAIL,
      to: email,
      subject: "OTP for SignUp",
      text: `Your OTP for verification: ${otp}`,
    };
    const info = await transporter.sendMail(mailOption);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    req.flash("otp_err", "ErrorWhile sending the otp");
  }
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

//for reset password sent mail

const sendResetPasswordMail = async (name, email, token) => {
  try {
    if (!isValidEmail(email)) {
      console.log("Invalid email address:", email);
      return;
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.OTP_EMAIL,
        pass: process.env.OTP_EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.OTP_EMAIL,
      to: email,
      subject: "Reset Your Password | BELLE",
      html: `<p>Dear ${name},</p>
            
            <p>You are receiving this email because a request to reset the password for your Belle account has been initiated. If you did not request this change, please disregard this email.</p>
            
            <p>To reset your password, please click on the link below:</p>
            <p><a href="http://127.0.0.1:3000/forget-password?token=${token}">Reset Password</a></p>
            
            <p>If you are unable to click the link, please copy and paste the following URL into your web browser:</p>
            <p>http://127.0.0.1:3000/forget-password?token=${token}</p>
            
            <p>Please note that this link will expire after a certain period of time for security reasons. If you do not complete the password reset process within one hour, you will need to submit another request.</p>
            
            <p>Thank you for using Belle.</p>
            
            <p>Sincerely,<br>
            Belle</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { sentOtpToUserEmail, sendResetPasswordMail };
