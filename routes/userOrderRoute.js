const express = require('express');
const userOrderRoute = express.Router();
const orderController = require("../controller/userOrderController");
const {isLogin, isLogout, isBlocked} = require('../middlewares/userAuth');


userOrderRoute.get('', isLogin, isBlocked, orderController.loadOrderConfirm);
userOrderRoute.post('/placeOrder', orderController.placeOrder);
userOrderRoute.post('/orderList', orderController.loadMyOrders);
userOrderRoute.post('/orderCancel', orderController.cancelMyOrder);
userOrderRoute.post('/orderReturn', orderController.returnMyOrder);





module.exports = userOrderRoute;
