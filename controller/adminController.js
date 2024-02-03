const asyncHandler = require("express-async-handler");
const UserDb = require("../models/userModel");

const loadAdminlogin = asyncHandler(async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache');
    const admin = res.locals.admin;
    console.log("adminGettinChecking", admin);
    let success = req.flash("fmessage")[0];
    if (admin) {
      res.render("admin/dashboard", { message: success });
    } else {
      res.render("admin/adminLogin", { message: success });
    }
  } catch (error) {
    console.log("loadAdminlogin", error);
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
        console.log("usergettingLogin", req.session.adminID);
        return res.render("admin/dashboard", { findAdmin });
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
    req.session.destroy();
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
};
