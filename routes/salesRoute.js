const express = require('express');
const salesRouter = express.Router();
const salesController = require('../controller/salesController');
const { isLogin, isLogout } = require("../middlewares/adminAuth");


salesRouter.get('', salesController.loadSalesReport)


module.exports = salesRouter;