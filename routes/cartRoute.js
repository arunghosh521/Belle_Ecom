const express = require("express");
const cartRoute = express.Router();
const cartController = require("../controller/cartController");
const {isLogin, isLogout, isBlocked} = require('../middlewares/userAuth');



cartRoute.route('')
.get(isLogin, isBlocked, cartController.loadUserCart)
.post(cartController.insertCartItem);

cartRoute.post('/update', cartController.cartUpdate)
cartRoute.get('/checkout', isLogin, isBlocked, cartController.loadCheckout)
cartRoute.delete('/remove', cartController.removeCartItem)
cartRoute.post('/applyCoupon', cartController.applyCoupon)
cartRoute.delete('/removeCoupon', cartController.removeCoupon)


module.exports = cartRoute