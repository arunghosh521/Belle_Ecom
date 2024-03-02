const express = require("express");
const orderRouter = express.Router();
const orderController = require("../controller/orderController");
const { isLogin, isLogout } = require("../middlewares/adminAuth");



orderRouter.get('', isLogin, orderController.loadOrderList);
orderRouter.get('/orderDetails', isLogin, orderController.loadOrderDetails);
orderRouter.post('/updateOrderStatus', orderController.updateOrderStatus);

module.exports = orderRouter;
