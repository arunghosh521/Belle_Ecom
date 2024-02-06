const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
//const checkUserBlocked = require("../middlewares/userCheck");
const {isLogin, isLogout} = require('../middlewares/userAuth');



router.get("/",userController.loadHome);
//router.use(userAuthMiddleware);
router
  .route("/register")
  .get(isLogout,userController.loadRegister)
  .post(userController.createUser);
router.post("/validate", userController.validateUser);
router.post("/generate-otp", userController.generateOtpCntrl);
router.post("/submitOtp", userController.submitOtpHandler);
router.post("/resend-otp", userController.resendOtp);
router
  .route("/login")
  .get(isLogout, userController.loadLogin)
  .post(userController.loginUserCtrl);
router.get("/logout", isLogin, userController.userLogout);
router.get('/productView', userController.loadProductUserView);
router.get('/singleProduct', isLogin, userController.loadSingleProductUserView);
router.get('/userProfile', isLogin, userController.loadUserProfile);
router.get('/cart', isLogin, userController.loadUserCart);




module.exports = router; 
