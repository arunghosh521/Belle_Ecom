const express = require("express");
const couponRoute = express.Router();
const couponController = require("../controller/couponController");
const { isLogin, isLogout } = require("../middlewares/adminAuth");

couponRoute
  .route("/createCoupon")
  .get(isLogin, couponController.loadCreateCoupon)
  .post(couponController.addNewCoupon);
couponRoute.get("/couponList", couponController.loadCouponList);
couponRoute.route('/couponEdit')
.get(isLogin, couponController.loadCouponEdit)
.patch(couponController.editCouponControl)
couponRoute.delete('/deleteCoupon',couponController.deleteCouponControl);
couponRoute.post('/statusChangeCoupon',couponController.statusChangeOfCoupon);

module.exports = couponRoute;
