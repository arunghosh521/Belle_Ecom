const mongoose = require("mongoose");

var addressSchema = new mongoose.Schema({
  Fname: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mobile:{
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  apartment: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  default: {
    type: Boolean,
    default: false,
  },
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("Address", addressSchema);
