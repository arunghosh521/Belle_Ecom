const asyncHandler = require("express-async-handler");
const CartDB = require("../models/cart");
const UserDB = require("../models/userModel");
const ProductDB = require("../models/addProducts");

const loadUserCart = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    console.log("product ID");
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    console.log("singleProduct", cartProduct);
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
    let cart = await CartDB.findOne({ orderBy: req.session.userId });
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
      cart.cartTotal += product.price * quantity;
    } else {
      cart.products.push({
        product: productId,
        quantity: quantity,
        price: product.price,
      });
      cart.cartTotal += product.price * quantity;
    }
    await cart.save();

    res.json({ success: true });
  } catch (error) {
    console.log("InsertCartError", error);
  }
});

module.exports = { loadUserCart, insertCartItem };
