const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/adminController");
const cacheControl  = require('../config/cacheCntrl')
const path = require("path");




adminRouter
  .route("")
  .get(cacheControl, adminController.loadAdminlogin)
  .post(adminController.AdminLoginCntrl);
adminRouter.get("/logout", adminController.logout);
adminRouter.get("/listUser", adminController.loadUsers);
adminRouter.post('/listUser/toggleBlock', adminController.toggleBlockUser);

module.exports = adminRouter;
