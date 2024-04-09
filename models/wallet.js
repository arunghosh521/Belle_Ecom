const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
  transactionId: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  transactionType: {
    type: String,
    enum: ["deposit", "withdrawal", "refund"],
    required: true,
  },
});

const walletSchema = new Schema({
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletHistory: [transactionSchema],
});

// Adding a virtual field to calculate the total balance
walletSchema.virtual("totalBalance").get(function () {
  return this.balance;
});

// Adding a method to add a transaction
walletSchema.methods.addTransaction = function (transaction) {
  this.walletHistory.push(transaction);
  // Update the balance based on the transaction type
  if (transaction.transactionType === "deposit") {
    this.balance += transaction.amount;
  } else if (transaction.transactionType === "withdrawal") {
    this.balance -= transaction.amount;
  } else if (transaction.transactionType === "refund") {
    this.balance += transaction.amount;
  }
  return this.save();
};

const wallet = mongoose.model('Wallet', walletSchema);

module.exports = wallet;
