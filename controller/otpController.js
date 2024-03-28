const { OTP } = require("../models/userOtp");
const asyncHandler = require("express-async-handler");
const { sentOtpToUserEmail } = require("./emailController");
const isEmail = require("validator");
const User = require("../models/userModel");
const Wallet = require("../models/Wallet");
const orderId = require("order-id")("key");

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const generateOtpCntrl = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email: email });
    console.log("existing user", existingUser);
    if (existingUser) {
      res.json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const newOtp = generateOtp();
    console.log("OTP:", newOtp);
    await saveOtpToDb(req, email, newOtp);

    await sentOtpToUserEmail(email, newOtp);

    res.json({ success: true, message: "OTP Sent Successfully" });
  } catch (error) {
    console.log("generateOtpCntrl", error);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

const submitOtpHandler = asyncHandler(async (req, res) => {
  try {
    const { otp, email, fname, lname, password } = req.body;
    const token = req.query.token;
    console.log("token", token);
    console.log("otp", otp);

    const isOtpValid = await verifyOtp(email, otp);

    if (isOtpValid) {
      const newUser = new User({
        firstname: fname,
        lastname: lname,
        email,
        password,
        is_admin: 0,
        is_blocked: 0,
        is_verified: true,
        refferedToken: token,
      });

      const userData = await newUser.save();
      req.session.userId = userData._id;

      let wallet = await Wallet.findOne({ user: userData._id });
      if (!wallet) {
        try {
          const newWallet = new Wallet({
            user: userData._id,
            walletHistory: [
              {
                transactionId: 0,
                date: Date.now(),
                amount: 0,
                description: "Initial balance",
                transactionType: "deposit",
              },
            ],
          });
          await newWallet.save();
          wallet = newWallet;
        } catch (walletError) {
          console.error("Error creating wallet:", walletError);
          return res.status(500).json({
            success: false,
            message: "Error creating wallet. Please try again later.",
          });
        }
      }

      return res.json({
        success: true,
        message: "User created successfully",
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid OTP. Please try again",
      });
    }
  } catch (error) {
    console.error("Error in submitOtpHandler:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const saveOtpToDb = asyncHandler(async (req, email, otp) => {
  try {
    const otpDocument = new OTP({
      email: email,
      otp: otp,
    });
    await otpDocument.save();
    return otp;
  } catch (error) {
    req.flash("otp_err", "Error saving OTP to the database:");
    console.log("Error saving OTP to the database:", error);
  }
});

const getStoredOtpFromDatabase = asyncHandler(async (email) => {
  try {
    const otpDocument = await OTP.findOne({ email: email });
    return otpDocument ? otpDocument.otp : null;
  } catch (error) {
    console.error("Error retrieving OTP from the database:", error);
    throw error;
  }
});

const verifyOtp = async (email, enteredOtp) => {
  try {
    const storedOtp = await getStoredOtpFromDatabase(email);

    // Compare the entered OTP with the stored OTP
    return storedOtp === enteredOtp;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const newOtp = generateOtp();
    console.log("resendOTP", newOtp);

    await saveOtpToDb(req, email, newOtp);

    await sentOtpToUserEmail(email, newOtp);
    return res.json({ success: true, message: "OTP resend successfully." });
  } catch (error) {
    console.log("Error sending OTP", error);
    req.flash("fmessage", "Internal server error");
    return res.json({ success: false, message: "Internal server error" });
  }
});
module.exports = {
  generateOtp,
  generateOtpCntrl,
  saveOtpToDb,
  getStoredOtpFromDatabase,
  verifyOtp,
  resendOtp,
  submitOtpHandler,
};
