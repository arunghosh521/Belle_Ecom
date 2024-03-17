const asyncHandler = require("express-async-handler");
const UserDb = require("../models/userModel");
const ProductDB = require("../models/products");
const OrderDB = require("../models/order");

const loadAdminlogin = asyncHandler(async (req, res) => {
  try {
    let success = req.flash("fmessage")[0];
    res.render("admin/adminLogin", { message: success });
  } catch (error) {
    console.log("loadAdminlogin", error);
  }
});

const loadDashboard = asyncHandler(async (req, res) => {
  try {
    const productCount = await ProductDB.find().count();
    const orderCount = await OrderDB.find().count();
    const userCount = await UserDb.find().count();
    console.log(userCount);
    function formatUserCount(userCount) {
      if (userCount >= 1000) {
          return (userCount / 1000).toFixed(1) + 'k';
      } else {
          return userCount.toString();
      }
  }
  const formattedUserCount = formatUserCount(userCount);
  console.log(formattedUserCount);

    res.render("admin/dashboard", {productCount, orderCount, userCount: formattedUserCount});
  } catch (error) {
    console.log("loadDashboardError", error);
  }
});

const AdminLoginCntrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const findAdmin = await UserDb.findOne({ email });
    console.log("admin:", findAdmin);
    if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
      if (findAdmin.is_admin === true) {
        req.session.adminID = findAdmin._id;
        console.log("admingettingLogin", req.session.adminID);
        return res.redirect("/admin/dashboard");
      }
    } else {
      req.flash("fmessage", "Invalid Credentials");
      console.log("redirected");
      res.redirect("/admin");
    }
  } catch (error) {}
});

const logout = asyncHandler(async (req, res) => {
  try {
    req.session.adminID = null;
    console.log("admin logout successfully");
    res.redirect("/admin");
  } catch (error) {
    console.log("logoutError", error);
  }
});

const loadUsers = asyncHandler(async (req, res) => {
  try {
    const User = await UserDb.find({ is_admin: false });
    res.render("admin/viewUser", { User });
  } catch (error) {
    console.log("loadUserError", loadUsers);
  }
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  try {
    console.log("body", req.body);
    const { userId, isBlocked } = req.body;

    const user = await UserDb.findByIdAndUpdate(
      userId,
      { is_blocked: isBlocked },
      { new: true }
    );

    console.log("Updated user:", user);

    res.json({ success: true });
  } catch (error) {
    console.error("ToggleBlockUserError", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = {
  loadAdminlogin,
  AdminLoginCntrl,
  logout,
  loadUsers,
  toggleBlockUser,
  loadDashboard,
};
