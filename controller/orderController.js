const asyncHandler = require("express-async-handler");

const OrderDB = require("../models/order");
const puppeteer = require("puppeteer");

const loadOrderList = asyncHandler(async (req, res) => {
  try {
    const orderData = await OrderDB.find().populate("products");
    //console.log("orderData", orderData);
    res.render("admin/orderList", { orderData });
  } catch (error) {
    console.log("loadOrderListError", error);
  }
});

const loadOrderDetails = asyncHandler(async (req, res) => {
  try {
    const id = req.query.id;
    // console.log("sdgfvdbd", id);
    const orderData = await OrderDB.findOne({ _id: id })
      .populate("products.product")
      .populate({ path: "address", model: "Address" });

    // console.log("orderDataDetails", orderData);
    res.render("admin/orderDetails", { orderData });
  } catch (error) {
    console.log("loadOrderDetailsError", error);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    //console.log("bodyDataFromUpdateOrder", orderId, newStatus);
    const order = await OrderDB.findById(orderId);

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "cannot change the status of a cancelled order.",
      });
    }

    const updatedOrder = await OrderDB.findByIdAndUpdate(
      orderId,
      {
        $set: { orderStatus: newStatus, statusChangedBy: "admin" },
      },
      { new: true }
    );
    //console.log("updatedOrder", updatedOrder);
    res.json({ success: true, updatedOrder });
  } catch (error) {
    console.log("updateOrderStatus", error);
    res.json({ success: false });
  }
});

const getOrderDetails = asyncHandler(async (req, res) => {
  try {
    const orders = await OrderDB.find({
      orderStatus: { $in: ["Cancelled", "Returned"] },
    });
    console.log("order", orders);
    const orderDetails = orders.map((order) => ({
      orderId: order._id,
      orderStatus: order.orderStatus,
      statusChangedBy: order.statusChangedBy,
    }));
    console.log("orderStatus", orderDetails);
    res.json(orderDetails);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const orderListPagination = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 5;

    const skip = (page - 1) * itemsPerPage;

    const orders = await OrderDB.find()
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 });

    const totalOrders = await OrderDB.countDocuments();

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    res.json({ orders, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: "serverError" });
  }
});

const downloadOrders = asyncHandler(async (req, res) => {
  try {
    const orderData = await OrderDB.find();

    const htmlContent = generateOrdersHTML(orderData);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4" });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);

    await browser.close();
  } catch (error) {
    console.log("Error in downloading PDF", error);
    res.status(500).send({ message: "Error generating PDF" });
  }
});

function generateOrdersHTML(orderData) {
  let htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
    }
  
    table {
        border-collapse: collapse;
        width: 80%; /* Adjust the width as needed */
        margin: auto; /* Center the table */
    }
    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    th {
        background-color: #4CAF50;
        color: white;
    }
    a {
        color: blue;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
      </style>
  </head>
  <body>
      <table>
          <tr>
              <th>Order Code</th>
              <th>Date</th>
              <th>Payment Method</th>
              <th>Delivery Status</th>
              <th>Amount</th>
              <th>Option</th>
          </tr>
`;

  orderData.forEach((order) => {
    htmlContent += `
      <tr>
          <td>${order.orderId}</td>
          <td>${order.orderedDate}</td>
          <td>${order.payment}</td>
          <td>${order.orderStatus}</td>
          <td>$${order.orderTotal}</td>
          <td><a href="/admin/orderList/orderDetails?id=${order._id}">Order Details</a></td>
      </tr>
  `;
  });

  htmlContent += `</table></body></html>`;

  return htmlContent;
}

module.exports = {
  loadOrderList,
  loadOrderDetails,
  updateOrderStatus,
  orderListPagination,
  downloadOrders,
  getOrderDetails,
};