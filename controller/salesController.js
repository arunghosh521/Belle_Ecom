const asyncHandler = require("express-async-handler");
const OrderDB = require("../models/order");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");
const moment = require("moment");
const { log } = require("util");

//* Load salesReport page
const loadSalesReport = asyncHandler(async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const week = moment().isoWeek();
    const month = moment().month();

    //* Query database to get all delivered orders
    let orderQuery = OrderDB.find({ orderStatus: "Delivered" })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");

    const type = req.query.type;

    if (type === "week") {
      const startDate = moment().year(year).week(week).startOf("week");
      const endDate = moment().year(year).week(week).endOf("week");
      orderQuery = orderQuery.where("createdAt").gte(startDate).lte(endDate);
    } else if (type === "year") {
      const startDate = moment().year(year).startOf("year");
      const endDate = moment().year(year).endOf("year");

      orderQuery = orderQuery.where("createdAt").gte(startDate).lte(endDate);
    } else if (type === "month") {
      const startDate = moment()
        .year(year)
        .month(month - 1)
        .startOf("month");
      const endDate = moment()
        .year(year)
        .month(month - 1)
        .endOf("month");
      orderQuery = orderQuery.where("createdAt").gte(startDate).lte(endDate);
    }

    const orderData = await orderQuery;
    //* Calculate total sum of orders
    const ordersWithActualPrice = orderData.map((order) => {
      return order.products.reduce(
        (acc, product) => acc + product.product.price * product.quantity,
        0
      );
    });
    const totalSum = ordersWithActualPrice.reduce(
      (acc, totalPrice) => acc + totalPrice,
      0
    );

    //* Calculate total order amount
    const orderTotalAmt = orderData.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);

    //* Calculate discount amount
    const discountAmount = totalSum - orderTotalAmt;

    res.render("admin/salesPage", {
      orderData,
      orderTotalAmt,
      totalSum,
      discountAmount,
    });
  } catch (error) {
    console.log("loadSalesPageError", error);
    res.status(500).json({ message: "Server error" });
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
      buffer = await generateSalesReportPdf(
        orderData,
        orderTotalAmt,
        totalSum,
        discountAmount
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": buffer.length,
      });
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 20, wrapText: true },
        {
          header: "Customer Name",
          key: "CustomerName",
          width: 15,
          wrapText: true,
        },
        { header: "Address", key: "address", width: 50, wrapText: true },
        {
          header: "Product Name",
          key: "productName",
          width: 30,
          wrapText: true,
        },
        { header: "Quantity", key: "quantity", width: 10, wrapText: true },
        { header: "Order Total", key: "orderTotal", width: 10, wrapText: true },
        { header: "Status", key: "status", width: 10, wrapText: true },
        { header: "Order Date", key: "orderDate", width: 15, wrapText: true },
      ];

      orderData.forEach((order, index) => {
        let productNames = [];
        let Quantities = [];
        order.products.forEach((product) => {
          productNames.push(product.product.name);
          Quantities.push(product.quantity);
        });
        const productName = productNames.join(",\n");
        const Quantity = Quantities.join("\n");
        const customerName = order.orderBy?.firstname || "N/A";
        const addressDetails = order.address[0]
          ? `${order.address[0].address}, ${order.address[0].apartment}, ${order.address[0].city}, ${order.address[0].state}, ${order.address[0].pincode}, ${order.address[0].country}`
          : "N/A";

        worksheet.addRow({
          orderId: order.orderId,
          CustomerName: customerName,
          address: addressDetails,
          productName: productName,
          quantity: Quantity,
          orderTotal: order.orderTotal,
          status: order.orderStatus,
          orderDate: order.orderedDate,
        });
      });
      worksheet.addRow({
        orderId: "Total",
        CustomerName: "",
        address: "",
        productName: "",
        quantity: "",
        orderTotal: totalSum,
        status: "",
        orderDate: "",
      });

      worksheet.addRow({
        orderId: "Discount",
        CustomerName: "",
        address: "",
        productName: "",
        quantity: "",
        orderTotal: discountAmount,
        status: "",
        orderDate: "",
      });
      worksheet.addRow({
        orderId: "Grant Total",
        CustomerName: "",
        address: "",
        productName: "",
        quantity: "",
        orderTotal: orderTotalAmt,
        status: "",
        orderDate: "",
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
