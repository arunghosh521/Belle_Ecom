const express = require("express");
const couponRoute = express.Router();
const couponController = require("../controller/couponController");
const { isLogin, isLogout, isBlocked } = require("../middlewares/userAuth");

couponRoute
  .route("/createCoupon")
  .get(couponController.loadCreateCoupon)
  .post(couponController.addNewCoupon);
couponRoute.get("/couponList", couponController.loadCouponList);
couponRoute.route('/couponEdit')
.get(couponController.loadCouponEdit)
.patch(couponController.editCouponControl)
couponRoute.delete('/deleteCoupon',couponController.deleteCouponControl);
couponRoute.post('/statusChange',couponController.statusChangeOfCoupon);

module.exports = couponRoute;
