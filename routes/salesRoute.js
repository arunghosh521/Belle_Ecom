const express = require('express');
const salesRouter = express.Router();
const salesController = require('../controller/salesController');
const { isLogin, isLogout } = require("../middlewares/adminAuth");


salesRouter.get('', salesController.loadSalesReport)

salesRouter.get('/filterSalesReport', salesController.loadFilteredSalesPage)
salesRouter.get('/download-salesreport', salesController.downloadSalesReport)
salesRouter.get('/download-filtered-salesreport', salesController.downloadFilteredSalesReport)
salesRouter.post('/searchByDate', salesController.filterSalesReportByDate)


module.exports = salesRouter;