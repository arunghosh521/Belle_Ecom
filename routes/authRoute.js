const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
//const checkUserBlocked = require("../middlewares/userCheck");
const {userAuthMiddleware} = require('../middlewares/userAuth');
const cacheControl = require('../config/cacheCntrl');



router.get("/",userController.loadHome);
router.use(userAuthMiddleware);
router
  .route("/register")
  .get(userController.loadRegister)
  .post(userController.createUser);
router.post("/validate", userController.validateUser);
router.post("/generate-otp", userController.generateOtpCntrl);
router.post("/submitOtp", userController.submitOtpHandler);
router.post("/resend-otp", userController.resendOtp);
router
  .route("/login")
  .get(cacheControl, userController.loadLogin)
  .post(userController.loginUserCtrl);
router.get("/logout", cacheControl, userController.userLogout);
router.get('/productView', userController.loadProductUserView);
router.get('/singleProduct/:id', userController.loadSingleProductUserView);




module.exports = router; 
