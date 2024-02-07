const express = require("express");
const cartRoute = express.Router();
const cartController = require("../controller/cartController");
const {isLogin, isLogout, isBlocked} = require('../middlewares/userAuth');



cartRoute.get('', isLogin, isBlocked, cartController.loadUserCart);


module.exports = {cartRoute}