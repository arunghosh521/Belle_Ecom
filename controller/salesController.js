const asyncHandler = require("express-async-handler");

const loadSalesReport = asyncHandler(async(req,res) => {
    try {
        res.render('admin/salesPage');
    } catch (error) {
        console.log("loadSalesPageError", error);
    }
});


module.exports = {loadSalesReport}