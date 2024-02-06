const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/adminController");
const {isLogin, isLogout} = require("../middlewares/adminAuth");




adminRouter
  .route("")
  .get(isLogout, adminController.loadAdminlogin)
  .post(adminController.AdminLoginCntrl);
adminRouter.get("/logout", isLogin, adminController.logout);
adminRouter.get("/listUser", adminController.loadUsers);
adminRouter.post('/listUser/toggleBlock', adminController.toggleBlockUser);

module.exports = adminRouter;
