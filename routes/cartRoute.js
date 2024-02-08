const express = require("express");
const cartRoute = express.Router();
const cartController = require("../controller/cartController");
const {isLogin, isLogout, isBlocked} = require('../middlewares/userAuth');



cartRoute.route('')
.get(isLogin, isBlocked, cartController.loadUserCart)
.post(cartController.insertCartItem);


module.exports = {cartRoute}