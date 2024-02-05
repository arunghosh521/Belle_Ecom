const { log } = require("sharp/lib/libvips");
const User = require("../models/userModel");
const ProductModel = require("../models/addProducts");
const categoryDB = require("../models/category");
const asyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");
// const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const {
  saveOtpToDb,
  getStoredOtpFromDatabase,
  generateOtp,
  verifyOtp,
  resendOtp,
  generateOtpCntrl,
  submitOtpHandler,
} = require("../controller/otpCntrl");
const { sentOtpToUserEmail } = require("../controller/emailCntrl");
const Product = require("../models/addProducts");
//Rendering the home page
const loadHome = async (req, res) => {
  try {
    const user = res.locals.user || null;
    console.log("usergetting HomePage ", user);
    if (user) {
      res.render("user/home", { user: true, message: "" });
    } else {
      res.render("user/home", { user: false, message: "" });
    }
  } catch (error) {
    console.log(error);
  }
};

//REndering the register page
const loadRegister = async (req, res) => {
  try {
    let success = req.flash("fmessage")[0];
    const user = req.user || null;
    console.log("usergetting ", user);
    res.locals.user = user;
    if (req.user) {
      res.render("user/register", { user: true, message: success });
    } else {
      res.render("user/register", { user: false, message: success });
    }
  } catch (error) {
    console.error("Error in loadRegister:", error);
    res.status(500).send("Internal Server Error");
  }
};

//Rendering the user logged in page
const loadLogin = async (req, res) => {
  try {
    let success = req.flash("fmessage")[0];
    const user = res.locals.user || null;
    console.log("usergetting ", user);
    res.locals.user = user;
    if (req.user) {
      res.render("user/login", { user: true, message: success });
    } else {
      res.render("user/login", { user: false, message: success });
    }
    console.log("usergetting Checking", res.locals.user);
  } catch (error) {
    console.log(error);
  }
};

const userLogout = asyncHandler(async (req, res) => {
  try {
    req.session.destroy();
    console.log("logout successfully");
    res.redirect("/");
  } catch (error) {
    console.log("logoutError", error);
    req.flash("message", " ");
  }
});

//Validate form
const validateUser = asyncHandler(async (req, res) => {
  try {
    const { firstname, email, password, otp } = req.body;

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
    } else if (!/^\S+@gmail\.com$|^\S+@cubene\.com$/.test(email)) {
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
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//Create user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(req.body);

    // Assuming otp is verified successfully
    const isOtpValid = await verifyOtp(email, otp);
    console.log("Valid OTP", isOtpValid);
    if (isOtpValid) {
      //   const newUser = new User({
      //     firstname: fname,
      //     lastname:lname,
      //     email,
      //     password,
      //     is_admin: 0,
      //     is_blocked: 0,
      //   });
      //   const userData = await newUser.save();
      // console.log("userdata", userData);

      // await User.findOneAndUpdate({email:email},{$set:{is_verified:'true'}});
      //await newUser.verifyUser();
      // console.log('Email', email);
      req.flash("fmessage", "User created successfully");
      return res.redirect("/login");
    } else {
      // Handle invalid OTP
      return res.redirect("/register");
    }
  } catch (error) {
    res.redirect("/register");
  }
});

//User Login
const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists or not
    const findUser = await User.findOne({ email });

    console.log("iam user", findUser);
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
        console.log("userBlocked");
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
          console.log("loggingGetting", req.session.userId);

          res.render("user/home", { user: findUser });
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

const loadProductUserView = asyncHandler(async (req, res) => {
  try {
    const user = res.locals.user || null;
    console.log("usergetting productPage ", user);
    const _id = req.params.id;
    const category = await categoryDB.findById(_id);
    const products = await ProductModel.find({ is_listed: true });
    console.log("product", products);
    if (user) {
      res.render("user/ProductPage", { products, category, user: true });
    } else {
      res.render("user/ProductPage", { products, category, user: false });
    }
  } catch (error) {
    console.log("productPageError", error);
  }
});

const loadSingleProductUserView = asyncHandler(async (req, res) => {
  
  try {
    console.log("single Product");
    const user = res.locals.user || null;
    console.log("usergetting singleproductPage ", user);

    const id = req.query.id;
    console.log('iam id ',id)
    console.log("prdID:-", id);
    const product = await Product.findById(id);
    console.log("singleProduct",product);
    
    if (user) {
      res.render("user/singleProduct", { product, user: true });
    } else {
      res.render("user/singleProduct", { product, user: false });
    }
  } catch (error) {
    console.log("loadSinglePageError", error);
  }
});

module.exports = {
  loadRegister,
  createUser,
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
};