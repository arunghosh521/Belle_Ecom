const express = require('express');
const salesRouter = express.Router();
const salesController = require('../controller/salesController');
const { isLogin, isLogout } = require("../middlewares/adminAuth");


salesRouter.get('', isLogin, salesController.loadSalesReport)

salesRouter.get('/filterSalesReport', isLogin,salesController.loadFilteredSalesPage)
salesRouter.get('/download-salesreport', isLogin, salesController.downloadSalesReport)
salesRouter.get('/download-filtered-salesreport',isLogin, salesController.downloadFilteredSalesReport)
salesRouter.post('/searchByDate', salesController.filterSalesReportByDate)


module.exports = salesRouter;