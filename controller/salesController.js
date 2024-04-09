const asyncHandler = require("express-async-handler");
const OrderDB = require("../models/order");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");

//* Load salesReport page
const loadSalesReport = asyncHandler(async (req, res) => {
  try {
    const orderData = await OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    //console.log("orderData", orderData);

    const ordersWithActualPrice = orderData.map((order) => {
      return order.products.reduce(
        (acc, product) => acc + product.product.price * product.quantity,
        0
      );
    });
    console.log("Orders with total price", ordersWithActualPrice);
    const totalSum = ordersWithActualPrice.reduce(
      (acc, totalPrice) => acc + totalPrice,
      0
    );
    console.log(totalSum, "zxcvbnm");

    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    //console.log(orderTotalAmt);
    const discountAmount = totalSum - orderTotalAmt;
    console.log(discountAmount, "DiscountAmount");
    res.render("admin/salesPage", {
      orderData,
      orderTotalAmt,
      totalSum,
      discountAmount,
    });
  } catch (error) {
    console.log("loadSalesPageError", error);
  }
});

//* Load filtered sales report page
const loadFilteredSalesPage = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (!startDate && !endDate) {
      return res.redirect("/admin/salesReport");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allOrders = await OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    const orderData = allOrders.filter((order) => {
      const orderDate = new Date(
        order.orderedDate.split("/").reverse().join("-")
      );
      return orderDate >= start && orderDate <= end;
    });

    const ordersWithActualPrice = orderData.map((order) => {
      return order.products.reduce(
        (acc, product) => acc + product.product.price * product.quantity,
        0
      );
    });
    console.log("Orders with total price", ordersWithActualPrice);
    const totalSum = ordersWithActualPrice.reduce(
      (acc, totalPrice) => acc + totalPrice,
      0
    );
    console.log(totalSum, "zxcvbnm");

    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const discountAmount = totalSum - orderTotalAmt;
    res.render("admin/salesPage", {
      orderData,
      orderTotalAmt,
      totalSum,
      discountAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//* Sales report HTML page for generating PFD
const generateSalesReportPdf = async (
  orderData,
  orderTotalAmt,
  totalSum,
  discountAmount
) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    "admin",
    "salesReportPdf.ejs"
  );

  const renderTemplate = async () => {
    try {
      return await ejs.renderFile(templatePath, {
        orderData,
        orderTotalAmt,
        totalSum,
        discountAmount,
      });
    } catch (err) {
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

//* Download sales report
const downloadSalesReport = asyncHandler(async (req, res) => {
  try {
    const format = req.query.format || "pdf";
    console.log(format, "format");
    const orderData = await OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const ordersWithActualPrice = orderData.map((order) => {
      return order.products.reduce(
        (acc, product) => acc + product.product.price,
        0
      );
    });
    const totalSum = ordersWithActualPrice.reduce(
      (acc, totalPrice) => acc + totalPrice,
      0
    );
    const discountAmount = totalSum - orderTotalAmt;

    let buffer;
    if (format === "pdf") {
      console.log("sdfghjk");
      buffer = await generateSalesReportPdf(
        orderData,
        orderTotalAmt,
        totalSum,
        discountAmount
      );
      console.log("bufferpdf", buffer);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": buffer.length,
      });
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      //console.log("workbook", workbook);
      const worksheet = workbook.addWorksheet("Sales Report");
      //console.log("worksheet", worksheet);

      worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 10 },
        { header: "Customer Name", key: "Customer Name", width: 20 },
        { header: "Address", key: "address", width: 20 },
        { header: "Product Name", key: "productname", width: 20 },
        { header: "Quantity", key: "quantity", width: 10 },
        { header: "Order Total", key: "orderTotal", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "orderDate", width: 15 },
      ];

      orderData.forEach((order, index) => {
        const product = order.products[0];
        console.log('product', product)
        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.orderBy.firstname} ${order.orderBy.lastname}`,
          address: `${order.address.address}, ${order.address.apartment}, ${order.address.city}, ${order.address.state}, ${order.address.pincode}, ${order.address.country}`,
          productName: product.product.name,
          quantity: product.quantity,
          orderTotal: order.orderTotal,
          status: order.orderStatus,
          orderDate: order.orderedDate,
        });
      });
      buffer = await workbook.xlsx.writeBuffer();
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": buffer.length,
      });
    }
    res.send(buffer);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
});

//* Filtering sales report by date
const filterSalesReportByDate = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allOrders = await OrderDB.find({ orderStatus: "Delivered" });

    const orderDataDateWise = allOrders.filter((order) => {
      const orderDate = new Date(
        order.orderedDate.split("/").reverse().join("-")
      );
      return orderDate >= start && orderDate <= end;
    });
    const orderTotalAmt = orderDataDateWise.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);

    const pdfBuffer = await generateSalesReportPdf(
      orderDataDateWise,
      orderTotalAmt
    );
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    req.session.filteredData = { orderData: orderDataDateWise, orderTotalAmt };

    res.json({ success: true, orderData: orderDataDateWise, orderTotalAmt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//* Download filtered sales report
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

//? Exporting modules to sales route
module.exports = {
  loadSalesReport,
  downloadSalesReport,
  filterSalesReportByDate,
  downloadFilteredSalesReport,
  loadFilteredSalesPage,
};
