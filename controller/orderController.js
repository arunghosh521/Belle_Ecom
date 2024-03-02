const asyncHandler = require("express-async-handler");

const OrderDB = require("../models/order");



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

  const updateOrderStatus = asyncHandler(async(req, res) => {
    try {
      const {orderId, newStatus} = req.body;
      //console.log("bodyDataFromUpdateOrder", orderId, newStatus);
      const updatedOrder = await OrderDB.findByIdAndUpdate(orderId, {$set:{orderStatus: newStatus}})
      //console.log("updatedOrder", updatedOrder);
      res.json({success: true});
    } catch (error) {
      console.log("updateOrderStatus", error);
      res.json({success: false});
    }
  })
  
  
  
  module.exports = {
    loadOrderList,
    loadOrderDetails,
    updateOrderStatus,
  };