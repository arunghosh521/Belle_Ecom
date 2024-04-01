const mongoose = require("mongoose");

var cartSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
        total: Number,
        offer: {
          type: String,
          default: false,
        },
      },
    ],
    couponApplied: {
      type: Boolean,
      default: false,
    },
    cartTotal: Number,
    orderBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);
