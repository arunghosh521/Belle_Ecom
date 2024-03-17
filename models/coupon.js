const mongoose = require("mongoose");
const couponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    minAmount: {
      type: Number,
      required: true,
    },
    couponDescription: {
      type: String,
      required: true,
    },
    Availability: {
      type: Number,
      required: true,
    },
    startData: {
        type: Date,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: Boolean,
      default: true,
    },
    userUsed: [
      {
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
