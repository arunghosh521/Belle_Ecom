const asyncHandler = require("express-async-handler");
const UserDB = require("../models/userModel");
const CartDB = require("../models/cart");
const AddressDB = require("../models/address");
const ProductDB = require("../models/products");
const orderDB = require("../models/order");
const orderId = require("order-id")("key");

const loadOrderConfirm = asyncHandler(async (req, res) => {
  try {
    const orderId = req.query.orderId;
    //console.log("orderId", orderId);
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const orderData = await orderDB
      .findOne({ orderId: orderId })
      .populate("products.product");
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    //const addressData = await AddressDB.findOne()
    res.render("user/placeOrder", { user: userData, cartProduct, orderData });
  } catch (error) {
    console.log("placeOrderError", error);
  }
});

const placeOrder = asyncHandler(async (req, res) => {
  try {
    const { addressId, selectedPayment } = req.body;
    //console.log("bodyData", req.body);
    const findCart = await CartDB.findOne({ orderBy: req.session.userId });
    //console.log("FindCArt", findCart);
    const cartItems = findCart.products;
    //console.log("sfdsdfvdsv", cartItems);
    const date = new Date();

    const orderDate = date.toLocaleDateString("en-GB");
    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    const productsInDb = await ProductDB.find({
      _id: { $in: cartItems.map((item) => item.product) },
    });
   // console.log("productsInDatabase", productsInDb);

    for (const item of cartItems) {
      const product = productsInDb.find(
        (p) => p._id.toString() === item.product.toString()
        );
        console.log("productsdvbisudgfvbedjhgvsuyb", product);
      if (product) {
        product.quantity -= item.quantity;
        product.sold += item.quantity;
        await ProductDB.updateOne(
          { _id: product._id },
          { $set: { quantity: product.quantity, sold: product.sold } }
          );
        }
      }

    const newOrder = new orderDB({
      products: cartItems,
      payment: selectedPayment,
      orderId: orderId.generate(),
      address: addressId,
      orderBy: req.session.userId,
      expectedDelivery: deliveryDate,
      orderedDate: orderDate,
      orderTotal: findCart.cartTotal,
    });
    await newOrder.save();
    //console.log("orderSaved", newOrder);
    await CartDB.updateOne(
      {orderBy: req.session.userId},
      {products: [], cartTotal: 0}
    );
    res.json({ CodSuccess: true, orderId: newOrder.orderId });
  } catch (error) {
    console.error("orderError", error);
  }
});

const loadMyOrders = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    //console.log("orderIdFromBody", orderId);
    const orderData = await orderDB
      .findOne({ orderId: orderId })
      .populate("products.product");
    //console.log("loadOrderData", orderData);
    res.json({ orderData });
  } catch (error) {
    console.log("loadError", error);
  }
});

const returnMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    //console.log("orderIdFromReturn", orderId);
    const updatedReturnOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Returned" } },
      { new: true }
    );

    const updatedProduct = await ProductDB.findById;
    res.json({success: true, ordeData: updatedReturnOrder});
  } catch (error) {
    console.log("returnOrderError", error);
    res.json({ success: false, error: "Filed to cancel the order" });
  }
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    //console.log("bodyDataCancel", orderId);
    const updatedCancelOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Cancelled" } },
      { new: true }
    );

    //console.log("orderDataFromCancel", updatedOrder);
    res.json({ success: true, orderData: updatedCancelOrder });
  } catch (error) {
    console.log("cancelOrderError", error);
    res.json({ success: false, error: "Filed to cancel the order" });
  }
});

module.exports = {
  loadOrderConfirm,
  placeOrder,
  loadMyOrders,
  cancelMyOrder,
  returnMyOrder,
};
