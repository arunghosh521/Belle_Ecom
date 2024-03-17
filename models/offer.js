const mongoose = require("mongoose");
const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    offerDescription: {
      type: String,
    },
    startingDate: {
        type: Date,
    },
    expiryDate: {
      type: Date,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
