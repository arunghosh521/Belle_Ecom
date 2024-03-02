const mongoose = require("mongoose");

var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
        offer: {
          type: String,
          default: false,
        },
      },
    ],
    orderId: {
      type: String,
    },
    payment: {},
    cancleReason: {
      type: String,
      default: "Not Processed",
    },
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
        "Returned",
      ],
    },
    address: {
      type: Array,
    },
    orderTotal: {
        type:Number,
    },
    orderedDate:{
        type: String,
    },
    orderBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expectedDelivery: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
