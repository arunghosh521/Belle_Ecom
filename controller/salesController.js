const asyncHandler = require("express-async-handler");
const OrderDB = require("../models/order");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");

const loadSalesReport = asyncHandler(async (req, res) => {
  try {
    const orderData = await OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    //console.log("orderData", orderData);
    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    //console.log(orderTotalAmt);
    res.render("admin/salesPage", { orderData, orderTotalAmt });
  } catch (error) {
    console.log("loadSalesPageError", error);
  }
});

const loadFilteredSalesPage = asyncHandler(async(req,res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    console.log("query", startDate);
    console.log("query",endDate);
   if(!startDate && !endDate) {
    return  res.redirect('/admin/salesReport');
   }
   const start = new Date(startDate);
    const end = new Date(endDate);
    const allOrders = await OrderDB.find({ orderStatus: "Delivered" })
    .populate("products.product")
    .populate({ path: "address", model: "Address" })
    .populate("orderBy");

    const orderData = allOrders.filter(order => {
      const orderDate = new Date(order.orderedDate.split('/').reverse().join('-'));
      return orderDate >= start && orderDate <= end;
    });
    const orderTotalAmt = orderData.reduce((total, order) => {
        return total + order.orderTotal;
      }, 0);
    console.log("zxcvbnm,",orderData);

    res.render("admin/salesPage", { orderData, orderTotalAmt });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
})

const generateSalesReportPdf = async (orderData, orderTotalAmt) => {
    const templatePath = path.join(
       __dirname,
       "..",
       "views",
       "admin",
       "salesReportPdf.ejs"
    );
   
    const renderTemplate = async () => {
       try {
         return await ejs.renderFile(templatePath, { orderData, orderTotalAmt });
       } catch (err) {
         console.error("Error rendering EJS template:", err);
         throw new Error("Error rendering sales report");
       }
    };
   
    const htmlContent = await renderTemplate();
   
    if (!htmlContent) {
       throw new Error("Failed to render sales report template");
    }
   
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
   
    return pdfBuffer;
   };
   

const downloadSalesReport = asyncHandler(async (req, res) => {
  try {
    const orderData = await OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    //console.log(orderData, "asdfghjkl");
    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);

    const pdfBuffer = await generateSalesReportPdf(orderData, orderTotalAmt);
 
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);

    //await browser.close();
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
});

const filterSalesReportByDate = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    console.log("dates", req.body);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allOrders = await OrderDB.find({ orderStatus: 'Delivered' });

    const orderDataDateWise = allOrders.filter(order => {
      const orderDate = new Date(order.orderedDate.split('/').reverse().join('-'));
      return orderDate >= start && orderDate <= end;
    });
    const orderTotalAmt = orderDataDateWise.reduce((total, order) => {
        return total + order.orderTotal;
      }, 0);
    console.log("zxcvbnm,",orderDataDateWise);

    const pdfBuffer = await generateSalesReportPdf(orderDataDateWise, orderTotalAmt);
    res.set({
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length,
      });
      req.session.filteredData = { orderData: orderDataDateWise, orderTotalAmt };

      res.json({success: true, orderData: orderDataDateWise, orderTotalAmt});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const downloadFilteredSalesReport = asyncHandler(async (req, res) => {
    try {
        const { orderData, orderTotalAmt } = req.session.filteredData;

       const pdfBuffer = await generateSalesReportPdf(orderData, orderTotalAmt);
   
       res.set({
         "Content-Type": "application/pdf",
         "Content-Length": pdfBuffer.length,
         "Content-Disposition": `attachment; filename=filtered_sales_report.pdf`,
       });
       res.send(pdfBuffer);
    } catch (error) {
       console.error(error);
       res.status(500).send("Error generating filtered sales report PDF");
    }
   });
   

module.exports = {
  loadSalesReport,
  downloadSalesReport,
  filterSalesReportByDate,
  downloadFilteredSalesReport,
  loadFilteredSalesPage,
};