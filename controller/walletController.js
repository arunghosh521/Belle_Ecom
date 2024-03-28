const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const WalletDB = require("../models/Wallet");
const UserDB = require("../models/userModel");
const orderId = require("order-id")("key");
const Razorpay = require("razorpay");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const generateRefferalToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const addMoneyToWallet = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;
    const AmountToAdd = parseInt(amount);
    const newOrderId = orderId.generate();
    const order = await razorpayInstance.orders.create({
      amount: AmountToAdd,
      currency: "INR",
      receipt: newOrderId,
    });
    res.json({ success: true, order });
  } catch (error) {
    console.log("errorWhileAddingmoney", error);
  }
});

const razorPaymentVerify = asyncHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature, transactionId, Amount } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    console.log("generatedSignature", generatedSignature);
    if (generatedSignature === signature) {
      const userId = req.session.userId;
      const wallet = await WalletDB.findOne({ user: userId });
      if (!wallet) {
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
      }
      const transaction = {
        transactionId: transactionId,
        date: new Date(),
        amount: parseInt(Amount) / 100,
        description: "Payment From Razorpay",
        transactionType: "deposit",
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

const refferalLinkGenerating = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.userId;
    const UserData = await UserDB.findOne({ _id: userId });
    if (UserData.refferalOfferToken) {
      const existingToken = UserData.refferalOfferToken;
      const existedLink =  `http://127.0.0.1:3000/register?token=${existingToken}`;
      res.json({ success: false, link: existedLink, message: "Link copied to clipboard" });
    } else {
      const token = generateRefferalToken();
      const generatedLink = `http://127.0.0.1:3000/register?token=${token}`;
      UserData.refferalOfferToken = token;
      UserData.save();
      res.json({
        success: true,
        link: generatedLink,
        message: "Link copied to clipboard",
      });
    }
  } catch (error) {
    console.log("referralLinkError", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the referral link." });
  }
});

const paginationForWallet = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPageOfWallet) || 4;

    const skip = (page - 1) * itemsPerPage;
    const walletDocument = await WalletDB.findOne({
      user: req.session.userId,
    }).lean();
    const sortedWalletHistory = walletDocument.walletHistory.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const totalPages = Math.ceil(
      walletDocument.walletHistory.length / itemsPerPage
    );
    const transactions = sortedWalletHistory.slice(skip, skip + itemsPerPage);

    res.json({ transactions, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: "serverError" });
  }
});

module.exports = {
  addMoneyToWallet,
  razorPaymentVerify,
  refferalLinkGenerating,
  paginationForWallet,
};
