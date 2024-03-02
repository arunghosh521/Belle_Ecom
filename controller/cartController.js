const asyncHandler = require("express-async-handler");
const CartDB = require("../models/cart");
const UserDB = require("../models/userModel");
const ProductDB = require("../models/products");
const AddressDB = require("../models/address");
const mongoose = require("mongoose");

const loadUserCart = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    console.log("product ID");
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    console.log("singleProduct", cartProduct.products.length);
    res.render("user/userCart", { user: userData, cartProduct });
  } catch (error) {
    console.log("userCartError", error);
  }
});

const insertCartItem = asyncHandler(async (req, res) => {
  try {
    const { quantity, productId } = req.body;
    console.log("bodyDataCArt", req.body);
    const product = await ProductDB.findById(productId);
    console.log("Product", product);
    if (!product) {
      return res.json({ success: false, message: "Product not Found" });
    }
    console.log("userID", req.session.userId);
    const cart = await CartDB.findOne({ orderBy: req.session.userId });
    console.log("cart:", cart);
    if (!cart) {
      cart = new CartDB({
        products: [],
        cartTotal: 0,
        orderBy: req.session.userId,
      });
      console.log("newCart", cart);
      await cart.save();
    }
    const existingProduct = cart.products.find(
      (item) => item.product.toString() === productId
    );
    console.log("existingCart", existingProduct);

    if (existingProduct) {
      existingProduct.quantity += parseInt(quantity);
    } else {
      cart.products.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        total : product.price * quantity,
      });
      cart.cartTotal += product.price * quantity;
    }
    await cart.save();

    res.json({ success: true });
  } catch (error) {
    console.log("InsertCartError", error);
  }
});

const loadCheckout = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const addressData = await AddressDB.find({user: req.session.userId});
    console.log(addressData);
    res.render("user/checkout", { user: userData, cartProduct, addressData });
  } catch (error) {
    console.log("checkOutError", error);
  }
});

const cartUpdate = asyncHandler(async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const productDetails = await ProductDB.findById(productId)
    const existingCart = await CartDB.findOne({ orderBy: req.session.userId });
    const existingProduct = existingCart.products.find(product => 
      product.product.equals(mongoose.Types.ObjectId(productId)))

    if (existingCart && existingProduct && productDetails.is_listed===true) {
      const newQuantity = quantity + existingProduct.quantity;
      if(newQuantity <= productDetails.quantity) { 
        existingProduct.quantity = newQuantity;
        existingProduct.total = existingProduct.quantity * productDetails.price;
        existingCart.cartTotal += quantity * productDetails.price;
        await existingCart.save();

        return res.json({ success: true, message: 'Quantity Updated successfully' });
      }else{
        return res.json({ stockErr: true, message: 'Requested quantity exceeds available quantity' });
      }
    } else {
      return res.status(404).json({ success: false, message: 'Product not found in the cart' });
    }

  } catch (error) {
    console.error("cartUpdateError:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const removeCartItem = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    console.log("removeProductID", productId);
    const findProduct = await CartDB.findOneAndUpdate(
      { "products._id": productId },
      { $pull: { products: { _id: productId } } },
      { new: true }
    );
    console.log("productforRemove", findProduct);
    if (!findProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not Found" });
    }
    let totalPrice = 0;
    findProduct.products.forEach(product => {
      totalPrice += product.price * product.quantity;
    });

    findProduct.cartTotal = totalPrice;
    await findProduct.save();
    
    res.json({
      success: true,
      message: "Product removed from the cart",
      updateCart: findProduct,
    });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = {
  loadUserCart,
  insertCartItem,
  loadCheckout,
  cartUpdate,
  removeCartItem,
};
