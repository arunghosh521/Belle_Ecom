const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const UserDB = require("../models/userModel");
const CartDB = require("../models/cart");
const WalletDb = require("../models/Wallet");
const AddressDB = require("../models/address");
const ProductDB = require("../models/products");
const orderDB = require("../models/order");
const orderIdGenerator = require("order-id")("key");
const Razorpay = require("razorpay");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const loadOrderConfirm = asyncHandler(async (req, res) => {
  try {
    const orderId = req.query.orderId;
    console.log("orderId", orderId);
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
    const { addressId, selectedPayment, subtotal } = req.body;
    console.log("bodyData", req.body);
    const totalAmount = parseInt(subtotal);
    const cartTotal = totalAmount / 100;
    console.log("amount", cartTotal);
    console.log("bodyDatawdefwef", typeof totalAmount, totalAmount);
    const findCart = await CartDB.findOne({ orderBy: req.session.userId });
    console.log("FindCArt", findCart);
    const cartItems = findCart.products;
    console.log("sfdsdfvdsv", cartItems);
    const wallet = await WalletDb.findOne({ user: req.session.userId });

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

    if (selectedPayment === "COD") {
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
          product.lastSold = new Date();
          await product.save();
          await ProductDB.updateOne(
            { _id: product._id },
            { $set: { quantity: product.quantity, sold: product.sold } }
          );
        }
      }
      const newOrder = new orderDB({
        products: cartItems,
        payment: selectedPayment,
        orderId: orderIdGenerator.generate(),
        address: addressId,
        orderBy: req.session.userId,
        expectedDelivery: deliveryDate,
        orderedDate: orderDate,
        orderTotal: findCart.cartTotal,
        paymentStatus: "pending",
      });
      await newOrder.save();
      //console.log("orderSaved", newOrder);
      await CartDB.updateOne(
        { orderBy: req.session.userId },
        { products: [], cartTotal: 0 }
      );
      console.log("orderIdOfNewOrder", newOrder.orderId);
      res.json({ CodSuccess: true, orderId: newOrder.orderId });
    } else if (selectedPayment === "banking") {
      const newOrderId = orderIdGenerator.generate();
      const order = await razorpayInstance.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: newOrderId,
      });

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
          product.lastSold = new Date();
          await product.save();
          await ProductDB.updateOne(
            { _id: product._id },
            { $set: { quantity: product.quantity, sold: product.sold } }
          );
        }
      }

      const newOrder = new orderDB({
        products: cartItems,
        payment: selectedPayment,
        orderId: newOrderId,
        address: addressId,
        orderBy: req.session.userId,
        expectedDelivery: deliveryDate,
        orderedDate: orderDate,
        orderTotal: findCart.cartTotal,
        paymentStatus: "pending",
      });
      await newOrder.save();
      console.log("newOrder", newOrder);
      await CartDB.updateOne(
        { orderBy: req.session.userId },
        { products: [], cartTotal: 0 }
      );
      console.log("order: ", order);
      res.json({ successBanking: true, order, orderId: newOrder.orderId });
    } else if (selectedPayment === "wallet") {
      const transactionId = orderIdGenerator.generate();

      if (wallet.balance > cartTotal) {
        const transaction = {
          transactionId: transactionId,
          date: new Date(),
          amount: cartTotal,
          description: "Payment for purchase",
          transactionType: "withdrawal",
        };
        await wallet.addTransaction(transaction);

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
            product.lastSold = new Date();
            await product.save();
            await ProductDB.updateOne(
              { _id: product._id },
              { $set: { quantity: product.quantity, sold: product.sold } }
            );
          }
        }
        const newOrder = new orderDB({
          products: cartItems,
          payment: selectedPayment,
          orderId: orderIdGenerator.generate(),
          address: addressId,
          orderBy: req.session.userId,
          expectedDelivery: deliveryDate,
          orderedDate: orderDate,
          orderTotal: findCart.cartTotal,
          paymentStatus: "pending",
        });
        await newOrder.save();
        //console.log("orderSaved", newOrder);
        await CartDB.updateOne(
          { orderBy: req.session.userId },
          { products: [], cartTotal: 0 }
        );
        console.log("orderIdOfNewOrder", newOrder.orderId);

        res.json({ successWallet: true, orderId: newOrder.orderId });
      } else {

        console.log("Wallet has enoughf money:");
        res
          .status(200)
          .json({ successWallet: false, message: "Wallet does not have enough money." });
      }
    } else {
      console.error("Razorpay order creation error:", error);
      res
        .status(400)
        .json({ successBanking: false, error: "Invalid payment method" });
    }
  } catch (error) {
    console.error("orderError", error);
    res
      .status(500)
      .json({ successBanking: false, error: "Order creation failed" });
  }
});

const razorpayPaymentVerify = asyncHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature, newOrderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    //console.log("generatedSignature", generatedSignature);

    if (generatedSignature === signature) {
      await orderDB.updateOne(
        { orderId: newOrderId },
        { $set: { paymentStatus: "completed" } }
      );
      res.json({
        success: true,
        orderId: newOrderId,
        message: "Payment verified successfully",
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.log("PaymentVerifying Error", error);
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

const orderListPagination = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 8;

    const skip = (page - 1) * itemsPerPage;

    const orders = await orderDB
      .find()
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 });

    const totalOrders = await orderDB.countDocuments();

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    res.json({ orders, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: "serverError" });
  }
});

// const getOrderIds = asyncHandler(async(req,res) => {
//   try {
//     const orders = await orderDB.find()
//     res.json({success: true, orders})
//   } catch (error) {
//     console.error("error", error);
//   }
// })

const returnMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    //console.log("orderIdFromReturn", orderId);
    const userId = req.session.userId;
    const transactionId = orderIdGenerator.generate();
    const order = await orderDB.findById(orderId).populate("products");
    const wallet = await WalletDb.findOne({ user: userId });
    console.log("walletFromReturn", wallet);
    const updatePromises = order.products.map(async (product) => {
      return ProductDB.findByIdAndUpdate(
        product._id,
        {
          $inc: {
            quantity: product.quantity,
            sold: -product.quantity,
            statusChangedBy: "user",
          },
        },
        { new: true }
      );
    });

    const updatedProducts = await Promise.all(updatePromises);
    console.log("updatedProducts", updatedProducts);

    const updatedReturnOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Returned" } },
      { new: true }
    );

    if (!wallet) {
      const newWallet = new wallet({
        user: userId,
        walletHistory: [
          {
            transactionId: 0,
            date: Date.now(),
            amount: 0,
            description: "Initial balance",
            transactionType: "refund",
          },
        ],
      });

      await newWallet.save();
      wallet = newWallet;
      console.log("asdfghjkl", newWallet);
    }
    const transaction = {
      transactionId: transactionId,
      date: new Date(),
      amount: order.orderTotal,
      description: "Refund from Belle",
      transactionType: "refund",
    };
    await wallet.addTransaction(transaction);

    res.json({ success: true, ordeData: updatedReturnOrder });
  } catch (error) {
    console.log("returnOrderError", error);
    res.json({ success: false, error: "Filed to cancel the order" });
  }
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    //console.log("bodyDataCancel", orderId);
    const order = await orderDB.findById(orderId).populate("products");

    const updatePromises = order.products.map(async (product) => {
      return ProductDB.findByIdAndUpdate(
        product._id,
        {
          $inc: {
            quantity: product.quantity,
            sold: -product.quantity,
            statusChangedBy: "user",
          },
        },
        { new: true }
      );
    });

    const updatedProducts = await Promise.all(updatePromises);
    console.log("updatedProducts", updatedProducts);
    const updatedCancelOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Cancelled", statusChangedBy: "user" } },
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
  razorpayPaymentVerify,
  orderListPagination,
};
