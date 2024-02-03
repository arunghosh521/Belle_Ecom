const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user:process.env.OTP_EMAIL,
        pass:process.env.OTP_EMAIL_PASS,
    },
});

const sentOtpToUserEmail = async (email, otp)=>{
    try {
        const mailOption = {
            from:process.env.OTP_EMAIL,
            to:email,
            subject:"OTP for SignUp",
            text:`Your OTP for verification: ${otp}`,
        };
        const info = await transporter.sendMail(mailOption);
        console.log("Email sent successfully", info.response);
    } catch (error) {
        console.error('Error sending OTP email:', error.message);
        req.flash("otp_err",'ErrorWhile sending the otp')

    }
}

module.exports = {sentOtpToUserEmail}