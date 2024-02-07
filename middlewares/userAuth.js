const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isBlocked = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const userData = await User.findOne({ _id: req.session.userId });
      console.log("userDataInBlocked", userData);
      if (userData.is_blocked === true) {
        req.session.destroy(); 
        res.redirect('/');
    } else {
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    console.log("isBlockedError", error);
  }
};

module.exports = {
  isLogin,
  isLogout,
  isBlocked,
};
