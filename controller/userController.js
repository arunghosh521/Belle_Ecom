const { log } = require("sharp/lib/libvips");
const User = require("../models/userModel");
const ProductModel = require("../models/products");
const categoryDB = require("../models/category");
const CartDB = require("../models/cart");
const OrderDB = require("../models/order");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { resizeAndSaveImages } = require("../middlewares/multer");

const {
  saveOtpToDb,
  getStoredOtpFromDatabase,
  generateOtp,
  verifyOtp,
  resendOtp,
  generateOtpCntrl,
  submitOtpHandler,
} = require("./otpController");
const {
  sentOtpToUserEmail,
  sendResetPasswordMail,
} = require("./emailController");
const Product = require("../models/products");
const Address = require("../models/address");

const generateResetToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

const fetchCartProductData = async (userId) => {
  try {
    const cartProduct = await CartDB.findOne({ orderBy: userId }).populate(
      "products.product"
    );
    return cartProduct;
  } catch (error) {
    console.error("Error fetching cart product data:", error);
    return null;
  }
};

//Rendering the home page
const loadHome = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    //console.log("cartPtoductFromHomePage:", cartProduct);
    //console.log("usergetting HomePage ", userData);
    res.render("user/home", { user: userData, cartProduct });
  } catch (error) {
    console.log(error);
  }
};

//REndering the register page
const loadRegister = async (req, res) => {
  try {
    const success = req.flash("fmessage")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/register", { user: userData, message: success });
  } catch (error) {
    console.error("Error in loadRegister:", error);
    res.status(500).send("Internal Server Error");
  }
};

//Rendering the user logged in page
const loadLogin = async (req, res) => {
  try {
    const success = req.flash("fmessage")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/login", { user: userData, message: success });
    //console.log("usergetting Checking", res.locals.user);
  } catch (error) {
    console.log(error);
  }
};

const userLogout = asyncHandler(async (req, res) => {
  try {
    req.session.userId = null;
    //console.log("logout successfully");
    res.redirect("/");
  } catch (error) {
    console.log("logoutError", error);
    req.flash("message", " ");
  }
});

//Validate form
const validateUser = asyncHandler(async (req, res) => {
  try {
    const { firstname, email, password, OTP } = req.body;

    let response = {};

    if (firstname && (firstname.trim() === "" || firstname.length < 3)) {
      response.fnameStatus =
        "Username cannot be Empty it must contain 3 or more letters";
    } else if (firstname && /[0-9]/.test(firstname)) {
      response.fnameStatus = "Username cannot be contain numbers";
    } else {
      response.fnameStatus = "";
    }

    if (!email || email.trim() === "") {
      //console.log("executed");
      response.emailStatus = "Email address is required";
    } else if (!/^\S+@gmail\.com$|^\S+@lendfash\.com$/.test(email)) {
      response.emailStatus = "Invalid email address";
    } else {
      response.emailStatus = "";
    }

    if (password && password.trim() === "") {
      response.passwordStatus = "Password cannot be Empty";
    } else if (password && password.length < 6) {
      response.passwordStatus = "Password must be at least 6 characters long";
    } else if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)
    ) {
      response.passwordStatus =
        "Password must include lowercase and uppercase letters, numbers, and special characters";
    } else {
      response.passwordStatus = "";
    }

    if (!OTP || OTP.trim() === "") {
      response.otpStatus = "OTP cannot be empty";
    } else if (isNaN(OTP)) {
      response.otpStatus = "OTP must number";
    }else if(OTP.length !== 6){
      response.otpStatus = "OTP must be exactly  6 numbers";
    } else {
      response.otpStatus = "";
    }
    

    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// //Create user
// const createUser = asyncHandler(async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     console.log(req.body);

//     // Assuming otp is verified successfully
//     const isOtpValid = await verifyOtp(email, otp);
//     console.log("Valid OTP", isOtpValid);
//     if (isOtpValid) {
//       const findUser = await User.findOne({email})
//       console.log("signupUser", findUser);
//       req.session.userId = findUser._id;
//       console.log("SignupGetting", req.session.userId);

//       req.flash("fmessage", "User created successfully");
//       return res.redirect("/");
//     } else {
//       // Handle invalid OTP
//       return res.redirect("/register");
//     }
//   } catch (error) {
//     res.redirect("/register");
//   }
// });

//User Login
const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists or not
    const findUser = await User.findOne({ email });

    //console.log("iam user", findUser);
    if (!findUser) {
      req.flash("fmessage", "User not found");
      return res.redirect("/login");
    }

    if (findUser && (await findUser.isPasswordMatched(password))) {
      if (findUser.is_verified === false) {
        req.flash("fmessage", "Account not verified.");
        return res.redirect("/login");
      }
      if (findUser.is_blocked === true) {
        //console.log("userBlocked");
        req.flash(
          "fmessage",
          "Your account is blocked. Please contact support"
        );
        return res.redirect("/login");
      }
      if (findUser.is_admin === true) {
        console.log("admin");
        req.flash("fmessage", "No permission to visit user side");
        return res.redirect("/login");
      }

      if (findUser && (await findUser.isPasswordMatched(password))) {
        if (findUser.is_verified === true) {
          req.session.userId = findUser._id;

          //console.log("loggingGetting", req.session.userId);

          res.redirect("/");
          //res.render("user/home", { user: findUser });
        }
      }
    } else {
      req.flash("fmessage", "Invalid Credentials");
      res.redirect("/login");
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Error in loginUserCtrl:", error);
    req.flash("fmessage", "An unexpected error occurred");
    res.redirect("/login");
  }
});

const loadForgetPassword = asyncHandler(async (req, res) => {
  try {
    let success = req.flash("forgetMsg")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/forgetPassword", { user: userData, message: success });
  } catch (error) {
    console.log("LoadforgetPasswrodError", error);
  }
});

const forgetPasswordCntrl = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    //console.log("forgetemail", email);
    const user = await User.findOne({ email: email });
    //console.log("forgetuser", user.firstname);

    if (!user) {
      req.flash("forgetMsg", "User not found");
      res.redirect("/forgetPassword");
    }

    const resetToken = generateResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 600000; //10 minutes
    await user.save();

    await sendResetPasswordMail(user.firstname, user.email, resetToken);

    req.flash("forgetMsg", "Please check your email to reset your password.");
    res.redirect("/forgetPassword");
  } catch (error) {
    req.flash("forgetMsg", "Password reset email sent Failed");
    console.log("forgetPasswordError", error);
    res.redirect("/forgetPassword");
  }
});

const loadForgetPasswordPage = asyncHandler(async (req, res) => {
  try {
    const token = req.query.token;
    const userData = await User.findOne({ passwordResetToken: token });
    if (!userData) {
      return res.render("user/404");
    }
    const cartProduct = await fetchCartProductData(req.session.userId);
    res.render("user/forget-password", { user: userData._id, cartProduct });
  } catch (error) {}
});

const forgetPasswordControl = asyncHandler(async (req, res) => {
  try {
    const { password, userId } = req.body;
    const updateUser = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          password: password,
          passwordResetToken: "",
          passwordChangedAt: new Date(),
        },
      }
    );
    req.flash("fmessage", "Password changed successfully");
    res.redirect("/login");
  } catch (error) {
    console.log("resetPasswordError", error);
  }
});

const loadProductUserView = asyncHandler(async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    
    const categories = await categoryDB.find({is_listed: true});
    //console.log("category", categories);
    const categoryIds = categories.map(category => category._id);
   // console.log("category", categoryIds);
    const products = await ProductModel.find({category:{$in:categoryIds}, is_listed: true });
    //console.log("products", categoryIds);
    res.render("user/ProductPage", {
      products, 
      categories,
      user: userData,
      cartProduct,
    });
  } catch (error) {
    console.log("productPageError", error);
  }
});

const loadSingleProductUserView = asyncHandler(async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const id = req.query.id;

    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const product = await Product.findById(id);
    res.render("user/singleProduct", { product, user: userData, cartProduct });
  } catch (error) {
    console.log("loadSinglePageError", error);
  }
});

const loadUserProfile = asyncHandler(async (req, res) => {
  try {
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");

    const orderData = await OrderDB.find({orderBy: req.session.userId});
    //console.log("orderData", orderData);
    const addressData = await Address.find({ user: req.session.userId });
    //console.log("addressData", addressData);
    const userData = await User.findOne({ _id: req.session.userId });
    //console.log("userEditData", userData);
    res.render("user/userProfile", {
      user: userData,
      cartProduct,
      addressData,
      orderData,
    });
  } catch (error) {
    console.log("loadUserProfileError", error);
  }
});

const editProfileCntrl = asyncHandler(async (req, res) => {
  try {
    const { Fname, Lname, UserID, Email, CurrentPass, newPass, confirmPass } =
      req.body;
    const userData = await User.findById(UserID);

    if (!(await userData.isPasswordMatched(CurrentPass))) {
      return res.status(400).json({ message: "Wrong current password" });
    }
    if (newPass) {
      if (newPass !== confirmPass) {
        return res
          .status(400)
          .json({ message: "New password and confirm password do not match" });
      }
      userData.password = newPass;
    }
    userData.firstname = Fname;
    userData.lastname = Lname;
    userData.email = Email;

    if (req.file) {
      userData.image = req.file.filename;
    }

    await userData.save();

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.log("EditUserError", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating profile",
      });
  }
});

const validateProfileForm = asyncHandler(async (req, res) => {
  try {
    const { Fname, Lname, UserID, Email, CurrentPass, newPass, confirmPass } =
      req.form;
    let response = {};

    if (firstname && (firstname.trim() === "" || firstname.length < 3)) {
      response.fnameStatus =
        "Username cannot be Empty it must contain 3 or more letters";
    } else if (firstname && /[0-9]/.test(firstname)) {
      response.fnameStatus = "Username cannot be contain numbers";
    } else {
      response.fnameStatus = "";
    }

    if (!email || email.trim() === "") {
      console.log("executed");
      response.emailStatus = "Email address is required";
    } else if (!/^\S+@gmail\.com$|^\S+@oprevolt\.com$/.test(email)) {
      response.emailStatus = "Invalid email address";
    } else {
      response.emailStatus = "";
    }

    if (password && password.trim() === "") {
      response.passwordStatus = "Password cannot be Empty";
    } else if (password && password.length < 6) {
      response.passwordStatus = "Password must be at least 6 characters long";
    } else if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)
    ) {
      response.passwordStatus =
        "Password must include lowercase and uppercase letters, numbers, and special characters";
    } else {
      response.passwordStatus = "";
    }

    res.send(response);
  } catch (error) {}
});

module.exports = {
  loadRegister,
  loadHome,
  loadLogin,
  loginUserCtrl,
  userLogout,
  validateUser,
  resendOtp,
  generateOtpCntrl,
  submitOtpHandler,
  loadProductUserView,
  loadSingleProductUserView,
  loadUserProfile,
  editProfileCntrl,
  loadForgetPassword,
  forgetPasswordCntrl,
  loadForgetPasswordPage,
  forgetPasswordControl,
  validateProfileForm,
};
