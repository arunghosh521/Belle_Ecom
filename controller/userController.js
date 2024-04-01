const User = require("../models/userModel");
const ProductModel = require("../models/products");
const categoryDB = require("../models/category");
const CartDB = require("../models/cart");
const OrderDB = require("../models/order");
const WishlistDB = require("../models/wishlist");
const OfferDB = require("../models/offer");
const WalletDB = require("../models/Wallet");
const CouponDB = require("../models/coupon");
const { NotFoundError, BadRequestError, InternalServerError } = require('../middlewares/appError');
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const mongoose = require("mongoose");

const {
  resendOtp,
  generateOtpCntrl,
  submitOtpHandler,
} = require("./otpController");
const {
  sendResetPasswordMail,
  sendVerificationMail,
} = require("./emailController");
const Product = require("../models/products");
const Address = require("../models/address");

//* Generating token for password reseting
const generateResetToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

//* function for send cart data to reset password page
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

//* Rendering the home page
const loadHome = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    res.render("user/home", { user: userData, cartProduct });
  } catch (error) {
    console.log(error);
  }
};

//* Rendering the aboutUs page
const loadAboutUs = asyncHandler(async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    res.render("user/aboutUs", { user: userData, cartProduct });
  } catch (error) {}
});

//* Rendering the register page
const loadRegister = async (req, res) => {
  try {
    const success = req.flash("existmessage")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/register", { user: userData, message: success });
  } catch (error) {
    console.error("Error in loadRegister:", error);
    res.status(500).send("Internal Server Error");
  }
};

//* Rendering the user logged in page
const loadLogin = async (req, res) => {
  try {
    const success = req.flash("fmessage")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/login", { user: userData, message: success });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//* Logout user control
const userLogout = asyncHandler(async (req, res) => {
  try {
    req.session.userId = null;
    res.redirect("/");
  } catch (error) {
    console.log("logoutError", error);
  }
});

//* Validate form of signup
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
      response.emailStatus = "Email address is required";
    } else if (!/^\S+@gmail\.com$|^\S+@gufum\.com$/.test(email)) {
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
    } else if (OTP.length !== 6) {
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


//* User Login control
const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    //* check if user exists or not
    const findUser = await User.findOne({ email });
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
        req.flash(
          "fmessage",
          "Your account is blocked. Please contact support"
        );
        return res.redirect("/login");
      }
      if (findUser.is_admin === true) {
        req.flash("fmessage", "No permission to visit user side");
        return res.redirect("/login");
      }

      if (findUser && (await findUser.isPasswordMatched(password))) {
        if (findUser.is_verified === true) {
          req.session.userId = findUser._id;
          res.redirect("/");
        }
      }
    } else {
      req.flash("fmessage", "Invalid Credentials");
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in loginUserCtrl:", error);
  }
});

//* Load forget password page
const loadForgetPassword = asyncHandler(async (req, res) => {
  try {
    let success = req.flash("forgetMsg")[0];
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/forgetPassword", { user: userData, message: success });
  } catch (error) {
    console.log("LoadforgetPasswrodError", error);
  }
});

//* Forget password control
const forgetPasswordCntrl = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      req.flash("forgetMsg", "User not found");
      res.redirect("/forgetPassword");
    }

    const resetToken = generateResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 600000; //?10 minutes
    await user.save();

    //? send reset password function from email controller
    await sendResetPasswordMail(user.firstname, user.email, resetToken);

    req.flash("forgetMsg", "Please check your email to reset your password.");
    res.redirect("/forgetPassword");
  } catch (error) {
    req.flash("forgetMsg", "Password reset email sent Failed");
    console.log("forgetPasswordError", error);
    res.redirect("/forgetPassword");
  }
});

//* Load forget password page via email 
const loadForgetPasswordPage = asyncHandler(async (req, res) => {
  try {
    const token = req.query.token;
    const userData = await User.findOne({ passwordResetToken: token });
    if (!userData) {
      return res.render("user/404");
    }
    const cartProduct = await fetchCartProductData(req.session.userId);
    res.render("user/forget-password", { user: userData._id, cartProduct });
  } catch (error) {
    console.log("loadForgetPageError", error);
  }
});

//* ForgetPassword control
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

//* Load products page for users
const loadProductUserView = asyncHandler(async (req, res) => {
  try {
    var page = 1;
    const limit = 4;
    const sort = req.query.sort;
    const size = req.query.size;
    const minPrice = req.query.priceFrom;
    const maxPrice = req.query.priceLimit;
    const category = req.query.catId;
    const userData = await User.findOne({ _id: req.session.userId });
    if (req.query.page) {
      page = req.query.page;
    }
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const categories = await categoryDB.find({ is_listed: true });

    let query = {
      is_listed: true,
    };

    if (category) {
      query.category = category;
    }
    if (size) {
      query.size = size;
    }

    if (minPrice && maxPrice) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }
    let sortQuery = {};
    if (sort) {
      switch (sort) {
        case "title-ascending":
          sortQuery = { title: 1 };
          break;
        case "price-low-to-high":
          sortQuery = { price: 1 };
          break;
        case "price-high-to-low":
          sortQuery = { price: -1 };
          break;
        case "date-new-to-old":
          sortQuery = { createdAt: -1 };
          break;
        case "date-old-to-new":
          sortQuery = { createdAt: 1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    } else {
      sortQuery = { createdAt: -1 };
    }
    const products = await ProductModel.find(query)
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("offer")
      .exec();

    const count = await ProductModel.find(query).countDocuments();
    const totalPages = Math.ceil(count / limit);
    const sizeForViewing = await ProductModel.aggregate([
      {
        $group: {
          _id: "$size",
        },
      },
    ]);
    const paginationLinks = generatePaginationLinks(
      page,
      totalPages,
      category,
      sort,
      size
    );

    res.render("user/ProductPage", {
      products,
      categories,
      totalPages: totalPages,
      currentPage: page,
      user: userData,
      cartProduct,
      sizeForViewing,
      paginationLinks: paginationLinks,
      category: category,
      currentSortOption: sort,
      currentSizeFilter: size,
    });
  } catch (error) {
    console.log("productPageError", error);
  }
});

//* Generating pagination links
function generatePaginationLinks(
  currentPage,
  totalPages,
  category,
  sort,
  size
) {
  let links = [];
  for (let i = currentPage; i <= totalPages; i++) {
    let link = `/productView?page=${i}`;
    if (category) {
      link += `&catId=${category}`;
    }
    if (sort) {
      link += `&sort=${sort}`;
    }
    if (size) {
      link += `&size=${size}`;
    }
    links.push(link);
  }
  return links;
}

//* Calculaton of delivery dates for displaying the product detail page
function calculateDeliveryDates() {
  const currentDate = new Date();
  const earliestDeliveryDate = new Date(currentDate);
  earliestDeliveryDate.setDate(currentDate.getDate() + 1); //? Add 1 day for earliest delivery

  const latestDeliveryDate = new Date(currentDate);
  latestDeliveryDate.setDate(currentDate.getDate() + 7); //? Add 7 days for latest delivery

  return {
    earliestDeliveryDate,
    latestDeliveryDate,
  };
}

//* Load product detail page
const loadSingleProductUserView = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.userId;
    const userObjectId = mongoose.Types.ObjectId(userId);
    const userData = await User.findOne({ _id: req.session.userId });
    const id = req.query.id;
    const { earliestDeliveryDate, latestDeliveryDate } =
      calculateDeliveryDates();

    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const product = await Product.findById(id).populate("offer");
    let couponData = await CouponDB.findOne({
      "userUsed.user._id": userObjectId,
    });
    if (!couponData || couponData.userUsed.length === 0) {
      couponData = null;
    } else {
      console.log("Coupon found:", couponData);
    }
    const wishlistProduct = await WishlistDB.findOne({
      user: req.session.userId,
      "products.product": product._id,
    });
    const currentTime = new Date();
    const lastSoldTime = new Date(product.lastSold);
    const timeDifferenceInHours =
      (currentTime - lastSoldTime) / (1000 * 60 * 60);
    const formattedEarliestDate = earliestDeliveryDate.toLocaleDateString(
      "en-US",
      { weekday: "short", month: "short", day: "numeric" }
    );
    const formattedLatestDate = latestDeliveryDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    res.render("user/singleProduct", {
      product,
      user: userData,
      cartProduct,
      timeDifferenceInHours,
      formattedEarliestDate,
      formattedLatestDate,
      couponData,
      wishlistProduct: !!wishlistProduct,
    });
  } catch (error) {
    throw new NotFoundError("Page not found");
  }
});

//* Load user profile page
const loadUserProfile = asyncHandler(async (req, res) => {
  try {
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");

    let walletData = await WalletDB.findOne({ user: req.session.userId });
    if (walletData && walletData.walletHistory) {
      walletData.walletHistory.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    }
    if (!walletData) {
      const newWallet = new WalletDB({
        user: req.session.userId,
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
      walletData = [newWallet];
    }

    const orderData = await OrderDB.find({ orderBy: req.session.userId });
    const addressData = await Address.find({ user: req.session.userId }).sort({
      createdAt: -1,
    });
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("user/userProfile", {
      user: userData,
      cartProduct,
      addressData,
      orderData,
      walletData,
    });
  } catch (error) {
    console.log("loadUserProfileError", error);
  }
});

//* Edit profile control
const editProfileCntrl = asyncHandler(async (req, res) => {
  try {
    const { Fname, Lname, UserID, Email, CurrentPass, newPass, confirmPass } =
      req.body;

    //* Validate First Name
    if (Fname && (Fname.trim() === "" || Fname.length < 3)) {
      return res.status(200).json({
        success: false,
        message: "Username cannot be Empty it must contain 3 or more letters.",
      });
    } else if (Fname && /[0-9]/.test(Fname)) {
      return res.status(200).json({
        success: false,
        message: "Username cannot be contain numbers.",
      });
    }

    if (Lname && Lname.trim() === "") {
      return res.status(200).json({
        success: false,
        message: "LastName cannot be Empty",
      });
    }
    //* Validate Email
    if (!Email || Email.trim() === "") {
      return res
        .status(200)
        .json({ success: false, message: "Email address is required." });
    } else if (!/^\S+@gmail\.com$|^\S+@glaslack\.com$/.test(Email)) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid email address." });
    }

    if (!Fname || !Email || !Lname) {
      return res.status(200).json({
        success: false,
        message: "All fields required",
      });
    } else if (!CurrentPass) {
      return res.status(200).json({
        success: false,
        message: "Enter Password",
      });
    }

    const userData = await User.findById(UserID);

    if (req.file) {
      userData.image = req.file.filename;
    }

    if (!(await userData.isPasswordMatched(CurrentPass))) {
      return res
        .status(200)
        .json({ success: false, message: "Wrong current password" });
    }

    if (Email && Email.trim() !== "" && Email !== userData.email) {
      const existingUser = await User.findOne({ email: Email });
      if (existingUser) {
        return res
          .status(200)
          .json({ success: false, message: "This email is already in use." });
      }
      const token = generateResetToken();
      userData.email = Email;
      userData.is_verified = false;
      userData.passwordResetToken = token;
      userData.passwordResetExpires = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days
      await userData.save();

      await sendVerificationMail(userData.firstname, Email, token);
      await userData.save();
      return res.status(200).json({
        success: true,
        message: "Email verification sent. Please check your inbox.",
      });
    }

    if (newPass && newPass !== userData.password) {
      //* Validate Password
      if (newPass && newPass.trim() === "") {
        return res
          .status(200)
          .json({ success: false, message: "Password cannot be Empty." });
      } else if (newPass && newPass.length < 6) {
        return res.status(200).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      } else if (
        !/[a-z]/.test(newPass) ||
        !/[A-Z]/.test(newPass) ||
        !/[0-9]/.test(newPass) ||
        !/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(newPass)
      ) {
        return res.status(200).json({
          success: false,
          message:
            "Password must include lowercase and uppercase letters, numbers, and special characters.",
        });
      }

      if (newPass !== confirmPass) {
        return res.status(200).json({
          success: false,
          message: "New password and confirm password do not match",
        });
      }
      userData.password = newPass;
    }
    userData.firstname = Fname;
    userData.lastname = Lname;
    await userData.save();

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.log("EditUserError", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating profile",
    });
  }
});

//* Change email from edit profile
const changedEmailVerify = asyncHandler(async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).send("Token is missing");
    }
    const user = await User.findOne({ passwordResetToken: token });
    if (!user) {
      return res.render("user/404");
    }
    user.is_verified = true;
    user.passwordResetToken = "";

    await user.save();
    req.flash("fmessage", "Email verified successfully");
    res.redirect("/login");
  } catch (error) {}
});

//? Exporting modules to auth route
module.exports = {
  loadRegister,
  loadHome,
  loadAboutUs,
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
  changedEmailVerify,
};
