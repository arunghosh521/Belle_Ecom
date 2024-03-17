const express = require('express');
const walletRouter = express.Router();
const walletController = require('../controller/walletController');
const { isLogin, isLogout } = require("../middlewares/adminAuth");

walletRouter.post('/wallet', walletController.addMoneyToWallet)
walletRouter.post('/paymentVerify', walletController.razorPaymentVerify)


module.exports = walletRouter;