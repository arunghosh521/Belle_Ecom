const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const UserDB = require("../models/userModel");
const CartDB = require("../models/cart");
const WalletDb = require("../models/wallet");
const AddressDB = require("../models/address");
const ProductDB = require("../models/products");
const orderDB = require("../models/order");
const orderIdGenerator = require("order-id")("key");
const dotenv = require("dotenv");
dotenv.config();
const Razorpay = require("razorpay");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

//* Instance of RazorPay
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

//* Load order confirmed page
const loadOrderConfirm = asyncHandler(async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const orderData = await orderDB
      .findOne({ orderId: orderId })
      .populate("products.product");
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    res.render("user/placeOrder", { user: userData, cartProduct, orderData });
  } catch (error) {
    console.log("placeOrderError", error);
  }
});

//* Placing the orders via COD, Razorpay, Wallet
const placeOrder = asyncHandler(async (req, res) => {
  try {
    const { addressId, selectedPayment, subtotal } = req.body;
    const totalAmount = parseInt(subtotal);
    const cartTotal = totalAmount / 100;
    const findCart = await CartDB.findOne({ orderBy: req.session.userId });
    const cartItems = findCart.products;
    const cartTotalFromDB = findCart.cartTotal;
    const wallet = await WalletDb.findOne({ user: req.session.userId });
    const orderDb = await orderDB.findOne({ orderBy: req.session.userId });
    const user = await UserDB.findOne({ _id: req.session.userId });
    const refferedtoken = user.refferedToken;
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

    //? COD payment
    if (selectedPayment === "COD") {
      if (cartTotalFromDB > 1000) {
        res.json({
          CodSuccess: false,
          message:
            "Orders exceeding 1000 are not eligible for cash on delivery.",
        });
      } else {
        if (!orderDb) {
          const productsInDb = await ProductDB.find({
            _id: { $in: cartItems.map((item) => item.product) },
          });
          for (const item of cartItems) {
            const product = productsInDb.find(
              (p) => p._id.toString() === item.product.toString()
            );
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
            refferOrder: true,
          });
          await newOrder.save();
          await CartDB.updateOne(
            { orderBy: req.session.userId },
            { products: [], cartTotal: 0, couponApplied: false }
          );

          //?refferal offer for the reffered person
          const tokenGeneratedUser = await UserDB.findOne({
            refferalOfferToken: refferedtoken,
          });
          const userId = tokenGeneratedUser._id;
          const transactionId = orderIdGenerator.generate();
          let wallet = await WalletDb.findOne({ user: userId });
          if (!wallet) {
            const newWallet = new WalletDb({
              user: userId,
              walletHistory: [
                {
                  transactionId: 0,
                  date: Date.now(),
                  amount: 0,
                  description: "Initial balance",
                  transactionType: "deposit",
                },
              ],
            });
            await newWallet.save();
            wallet = newWallet;
          }
          const addTransaction = {
            transactionId: transactionId,
            date: new Date(),
            amount: 199,
            description: "Payment from Refferal Offer",
            transactionType: "deposit",
          };
          await wallet.addTransaction(addTransaction);
          user.refferedToken = "";
          user.save();

          //?refferal offer for the user
          const UserId = req.session.userId;
          const newTransactionId = orderIdGenerator.generate();
          let newUserWallet = await WalletDb.findOne({ user: UserId });
          if (!newUserWallet) {
            let newWallet = new WalletDb({
              user: UserId,
              walletHistory: [
                {
                  transactionId: 0,
                  date: Date.now(),
                  amount: 0,
                  description: "Initial balance",
                  transactionType: "deposit",
                },
              ],
            });
            await newWallet.save();
            newUserWallet = newWallet;
          }
          const transaction = {
            transactionId: newTransactionId,
            date: new Date(),
            amount: 99,
            description: "Payment from Refferal Offer",
            transactionType: "deposit",
          };
          await newUserWallet.addTransaction(transaction);

          res.json({ CodSuccess: true, orderId: newOrder.orderId });
        } else {
          const productsInDb = await ProductDB.find({
            _id: { $in: cartItems.map((item) => item.product) },
          });

          for (const item of cartItems) {
            const product = productsInDb.find(
              (p) => p._id.toString() === item.product.toString()
            );
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
          await CartDB.updateOne(
            { orderBy: req.session.userId },
            { products: [], cartTotal: 0, couponApplied: false }
          );
          res.json({ CodSuccess: true, orderId: newOrder.orderId });
        }
      }
    }
    //? Razorpay payment
    else if (selectedPayment === "banking") {
      const newOrderId = orderIdGenerator.generate();
      const order = await razorpayInstance.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: newOrderId,
      });

      const productsInDb = await ProductDB.find({
        _id: { $in: cartItems.map((item) => item.product) },
      });

      for (const item of cartItems) {
        const product = productsInDb.find(
          (p) => p._id.toString() === item.product.toString()
        );
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
        paymentStatus: "Pending",
      });
      await newOrder.save();
      await CartDB.updateOne(
        { orderBy: req.session.userId },
        { products: [], cartTotal: 0, couponApplied: false }
      );
      res.json({ successBanking: true, order, orderId: newOrder.orderId });
    }
    //? Wallet payment
    else if (selectedPayment === "wallet") {
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

        for (const item of cartItems) {
          const product = productsInDb.find(
            (p) => p._id.toString() === item.product.toString()
          );
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
          paymentStatus: "completed",
        });
        await newOrder.save();
        await CartDB.updateOne(
          { orderBy: req.session.userId },
          { products: [], cartTotal: 0, couponApplied: false }
        );

        res.json({ successWallet: true, orderId: newOrder.orderId });
      } else {
        res.status(200).json({
          successWallet: false,
          message: "Wallet does not have enough money.",
        });
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

//* Verifying payment of razorpay
const razorpayPaymentVerify = asyncHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature, newOrderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

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
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
});

//* Load my orders page
const loadMyOrders = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    const orderData = await orderDB
      .findOne({ orderId: orderId })
      .populate("products.product");
    res.json({ orderData });
  } catch (error) {
    console.log("loadError", error);
  }
});

//* Pagination for order list
const orderListPagination = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 5;

    const skip = (page - 1) * itemsPerPage;

    const orders = await orderDB
      .find({ orderBy: req.session.userId })
      .skip(skip)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 });

    const totalOrders = await orderDB.countDocuments({
      orderBy: req.session.userId,
    });

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    res.json({ orders, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: "serverError" });
  }
});

//* Return order control
const returnMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId, returnReason } = req.body;
    console.log('body', returnReason)
    const userId = req.session.userId;
    const transactionId = orderIdGenerator.generate();
    const order = await orderDB.findById(orderId).populate("products");
    const wallet = await WalletDb.findOne({ user: userId });
    if(order.refferOrder === true) {
      return res.json({ success: false, message: "This order cannot be returned as it was placed using a referral reward." });
    }
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
    const updatedReturnOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Returned", returnReason: returnReason } },
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
    }
    const transaction = {
      transactionId: transactionId,
      date: new Date(),
      amount: order.orderTotal,
      description: "Refund from Belle",
      transactionType: "refund",
    };
    await wallet.addTransaction(transaction);

    res.json({ success: true, ordeData: updatedReturnOrder, message: 'Order returned successfully' });
  } catch (error) {
    console.log("returnOrderError", error);
    res.json({ success: false, error: "Filed to cancel the order" });
  }
});

//* Cancel order control
const cancelMyOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    const transactionId = orderIdGenerator.generate();
    const order = await orderDB.findById(orderId).populate("products");
    const wallet = await WalletDb.findOne({ user: req.session.userId });
    if(order.refferOrder === true) {
      return res.json({ success: false, message: "This order cannot be cancelled as it was placed using a referral reward." });
    }
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
    const updatedCancelOrder = await orderDB.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: "Cancelled", statusChangedBy: "user" } },
      { new: true }
    );

    if (order.paymentStatus === "Pending") {
      res.json({ success: true, orderData: updatedCancelOrder });
    } else {
      if (!wallet) {
        const newWallet = new WalletDb({
          user: req.session.userId,
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
      }
      const transaction = {
        transactionId: transactionId,
        date: new Date(),
        amount: order.orderTotal,
        description: "Refund from Belle",
        transactionType: "refund",
      };
      await wallet.addTransaction(transaction);

      res.json({ success: true, orderData: updatedCancelOrder, message: 'Order cancelled successfully' });
    }
  } catch (error) {
    console.log("cancelOrderError", error);
    res.json({ success: false, error: "Filed to cancel the order" });
  }
});

//* Retry payment from order list page
const retryPaymentOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    const failedOrder = await orderDB.findOne({ _id: orderId });
    const order = await razorpayInstance.orders.create({
      amount: failedOrder.orderTotal * 100,
      currency: "INR",
      receipt: failedOrder.orderId,
    });
    res.json({ success: true, order, orderId: failedOrder.orderId });
  } catch (error) {}
});

//* Verifying retrying payments
const retryPaymentVerify = asyncHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature, newOrderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//* Invoice download control
const downloadInvoice = asyncHandler(async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await orderDB
      .find({ _id: orderId })
      .populate("products.product")
      .populate({ path: "address", model: "Address" })
      .populate("orderBy");
    const pdfBuffer = await generateInvoicePdf(orderData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.log("invoiceDownloadError", error);
  }
});

//* Invoice HTML page generating
const generateInvoicePdf = async (orderData) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    "user",
    "invoice.ejs"
  );

  const renderTemplate = async () => {
    try {
      return await ejs.renderFile(templatePath, { orderData });
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
  await page.setContent(htmlContent, { baseURL: "http://localhost:3000" });
  const pdfBuffer = await page.pdf({ format: "letter" });
  await browser.close();

  return pdfBuffer;
};

//? Exporting modules to user order route
module.exports = {
  loadOrderConfirm,
  placeOrder,
  loadMyOrders,
  cancelMyOrder,
  returnMyOrder,
  razorpayPaymentVerify,
  orderListPagination,
  retryPaymentOrder,
  retryPaymentVerify,
  downloadInvoice,
};
