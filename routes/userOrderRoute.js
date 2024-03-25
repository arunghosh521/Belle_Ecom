const express = require('express');
const userOrderRoute = express.Router();
const orderController = require("../controller/userOrderController");
const {isLogin, isLogout, isBlocked} = require('../middlewares/userAuth');


userOrderRoute.get('', isLogin, isBlocked, orderController.loadOrderConfirm);
userOrderRoute.post('/placeOrder', orderController.placeOrder);
userOrderRoute.get('/pagination', orderController.orderListPagination);
//userOrderRoute.get('/getOrderIds', orderController.getOrderIds);
userOrderRoute.post('/paymentVerify', orderController.razorpayPaymentVerify);
userOrderRoute.post('/orderList', orderController.loadMyOrders);
userOrderRoute.post('/orderCancel', orderController.cancelMyOrder);
userOrderRoute.post('/orderReturn', orderController.returnMyOrder);
userOrderRoute.post('/retryPayment', orderController.retryPaymentOrder);
userOrderRoute.post('/paymentRetryVerify', orderController.retryPaymentVerify);





module.exports = userOrderRoute;
