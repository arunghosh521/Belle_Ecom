const mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true,
  },
  images: {
    type: [
      {
        type: String,
        required: true,
      },
    ],
  },
  quantity: {
    type: Number,
    required: true,
  },
  size:{
    type: String,
    required: true,
  },
  color:{
    type: String,
    required: true,
  },
  description:{
    type: String,
    required: true,
  },
  is_listed:{
    type: Boolean,
    default: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
