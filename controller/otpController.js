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
    //console.log("existing user", existingUser);
    if (existingUser) {
      req.flash("existmessage", "User with this email already exists");
      return res.redirect("/register");
    }

    const newOtp = generateOtp();
    console.log("OTP:", newOtp);
    await saveOtpToDb(req, email, newOtp);

    await sentOtpToUserEmail(email, newOtp);

    // const isOtpValid = await verifyOtp(email, otp);
    // if(!isOtpValid) {
    //   return res.json({success: false, message: 'Invalid OTP. Please try again'});
    // }

    res.json({ success: true, message: "OTP Sent Successfully" });
  } catch (error) {
    console.log("generateOtpCntrl", error);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

const submitOtpHandler = asyncHandler(async (req, res) => {
  try {
    const { otp, email } = req.body;
    const token = req.query.token;
    console.log("token", token);
    console.log("otp", otp);
    console.log("email", email);

    const isOtpValid = await verifyOtp(email, otp);

    if (isOtpValid) {
      if (token) {
        const tokenGeneratedUser = await User.findOne({
          refferalOfferToken: token,
        });
        const userId = tokenGeneratedUser._id;
        const transactionId = orderId.generate();
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
          const newWallet = new Wallet({
            user: userId,
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
          //console.log("asdfghjkl", newWallet);
        }
        const addTransaction = {
          transactionId: transactionId,
          date: new Date(),
          amount: 199,
          description: "Payment from Refferal Offer",
          transactionType: "deposit",
        };
        await wallet.addTransaction(addTransaction);
        // res.json({
        //   success: true,
        //   message: "Money added successfully",
        // });

        const { fname, lname, email, password } = req.body;

        const newUser = new User({
          firstname: fname,
          lastname: lname,
          email,
          password,
          is_admin: 0,
          is_blocked: 0,
          is_verified: true,
        });

        const userData = await newUser.save();
        console.log("userdata111111111111111111111111111111111111111111111111", userData._id);
        const newUserId = userData._id
        const newTransactionId = orderId.generate();
        let newUserWallet = await Wallet.findOne({ user: newUserId});
        console.log("newSavedUser", newUserWallet);
        if (!newUserWallet) {
          let newWallet = new Wallet({
            user: newUserId,
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
          newUserWallet = newWallet;
          console.log("asdfghjkl", newUserWallet);
        }
        const transaction = {
          transactionId: newTransactionId,
          date: new Date(),
          amount: 99,
          description: "Payment from Refferal Offer",
          transactionType: "deposit",
        };
        await newUserWallet.addTransaction(transaction);
        req.session.userId = userData._id;
        return res.json({
          success: true,
          message: "User created successfully",
        });
      } else {
        const { fname, lname, email, password } = req.body;

        const newUser = new User({
          firstname: fname,
          lastname: lname,
          email,
          password,
          is_admin: 0,
          is_blocked: 0,
          is_verified: true,
        });

        const userData = await newUser.save();
        //console.log("userdata", userData);
      }
    } else {
      return res.json({
        success: false,
        message: "Invalid OTP. Please try again",
      });
    }
  } catch (error) {
    console.log("Error in submitOtpHandler", error);
    res.json({ success: false, message: "Internal server error" });
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
    //console.log(otpDocument);
    return otpDocument ? otpDocument.otp : null;
  } catch (error) {
    console.error("Error retrieving OTP from the database:", error);
    throw error;
  }
});

const verifyOtp = async (email, enteredOtp) => {
  try {
    const storedOtp = await getStoredOtpFromDatabase(email);
    //console.log(storedOtp);

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
