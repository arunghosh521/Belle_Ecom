const asyncHandler = require('express-async-handler');
const CartDB = require('../models/cart');
const UserDB = require('../models/userModel');



const loadUserCart = asyncHandler(async (req, res) => {
    try {
      const userData = await User.findOne({ _id: req.session.userId });
      const productID = req.query.id;
      console.log("product ID", productID);
      const cartProduct = await CartDB.findById().populate("Product");
      console.log("cartProduct", cartProduct);
      res.render("user/userCart", { user: userData, cartProduct });
    } catch (error) {
      console.log("userCartError", error);
    }
  });
  

  module.exports = {loadUserCart}