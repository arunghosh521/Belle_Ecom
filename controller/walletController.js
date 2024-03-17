const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const WalletDB = require("../models/Wallet");
const orderId = require("order-id")("key");
const Razorpay = require("razorpay");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const addMoneyToWallet = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("asfbfhb ", amount);
    const AmountToAdd = parseInt(amount);
    console.log("bodyDatawdefwef", typeof AmountToAdd, AmountToAdd);
    const newOrderId = orderId.generate();
    const order = await razorpayInstance.orders.create({
      amount: AmountToAdd,
      currency: "INR",
      receipt: newOrderId,
    });
    console.log("newOrder", order);
    res.json({ success: true, order });
  } catch (error) {
    console.log("errorWhileAddingmoney", error);
  }
});

const razorPaymentVerify = asyncHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature, transactionId, Amount } = req.body;
    console.log("zxcvbnm", orderId, paymentId, signature, typeof(transactionId), Amount);
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    console.log("generatedSignature", generatedSignature);
    if (generatedSignature === signature) {

      const userId = req.session.userId;
      const wallet = await WalletDB.findOne({user: userId});
      if(!wallet) {
        const newWallet = new WalletDB({
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
        console.log("asdfghjkl", newWallet);
      }
      const transaction = {
        transactionId: transactionId,
        date: new Date(),
        amount: parseInt(Amount) /100,
        description: "Payment From Razorpay",
        transactionType: "deposit"
      };
      await wallet.addTransaction(transaction);
      res.json({
        success: true,
        message: "Money added successfully",
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error while verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = {
  addMoneyToWallet,
  razorPaymentVerify,
};
