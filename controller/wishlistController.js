const asyncHandler = require("express-async-handler");
const WishlistDB = require("../models/wishlist");
const UserDB = require("../models/userModel");
const CartDB = require("../models/cart");
const ProductDB = require('../models/products')
const mongoose = require('mongoose');

const loadWishlist = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");

    const wishListDetails = await WishlistDB.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.session.userId) } },
      { $unwind: "$products" },
      { $match: { "products.createdAt": { $exists: true } } }, 
      { $sort: { "products.createdAt": -1 } },
      {
         $lookup: {
           from: "products",
           localField: "products.product",
           foreignField: "_id",
           as: "products.product" 
         }
      },
      {
         $group: {
           _id: "$_id",
           user: { $first: "$user" },
           products: { $push: "$products" }
         }
      }
     ])
     
     const wishListData = wishListDetails.flatMap(wishlist => {
       return wishlist.products.map(product => {
         return product.product.map(product => {
           return product
          })
        });
      });    
    res.render("user/wishList", { user: userData, cartProduct, wishListData });
  } catch (error) {
    console.log("loadWishListError", error);
  }
});

const addToWishList = asyncHandler(async (req, res) => {
  try {
    const productId = req.body.productId;
    //console.log("productId", req.body);

    const wishList = await WishlistDB.findOne({ user: req.session.userId });

    if (!wishList) {
     const newWishlist = new WishlistDB({
        user: req.session.userId,
        products: [{ product: productId, createdAt: new Date()}],
      });
      await newWishlist.save();
      res
        .status(200)
        .json({ success: true, message: "Product added to wishlist" });
    } else {
      const productExist = wishList.products.some(
        (p) => p.product.toString() === productId.toString()
      );
      if (!productExist) {
        wishList.products.push({ product: productId });
        await wishList.save();

        res.status(200).json({ isInWishlist: true, message: "Product added to wishlist" });
      } else {
        res.status(200).json({
          success: false,
          message: "Product already exist in wishlist",
        });
      }
    }
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const checkProductInWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;
    const isInWishlist = await WishlistDB.findOne({
      user: userId,
      "products.product": productId,
    });
    res.json({ isInWishlist: !!isInWishlist });
  } catch (error) {
    console.error("Error checking product in wishlist:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const removeItemFromWishlist = asyncHandler(async (req, res) => {
  try {
    const itemId = req.query.itemId;
    const item = await WishlistDB.findOneAndUpdate(
      { user: req.session.userId, "products.product": itemId },
      { $pull: { products: { product: itemId } } },
      { new: true }
     );
    if (!item) {
      return res.status(404).json({message: 'Wishlist not found'})
    }
    res.json({item})
  } catch (error) {
    console.log("error", error);
  }
});

const addToCartFromWishlist = asyncHandler(async (req, res) => {
  try {
     const { productId, quantity = 1 } = req.body;
     //console.log("Product ID", productId);
 
     const product = await ProductDB.findById(productId);
     //console.log("Product", product);
 
     if (!product) {
       return res.json({ success: false, message: "Product not Found" });
     }
 
     //console.log("User ID", req.session.userId);
     const cart = await CartDB.findOne({ orderBy: req.session.userId });
     //console.log("Cart:", cart);
 
     if (!cart) {
       cart = new CartDB({
         products: [],
         cartTotal: 0,
         orderBy: req.session.userId,
       });
       console.log("New Cart", cart);
       await cart.save();
     }
 
     const existingProduct = cart.products.find(
       (item) => item.product.toString() === productId
     );
    // console.log("Existing Product", existingProduct);
 
     if (existingProduct) {
       existingProduct.quantity += parseInt(quantity);
       existingProduct.total = existingProduct.quantity * existingProduct.price;
       cart.cartTotal = cart.products.reduce((total, product) => {
        return total + (product.quantity * product.price);
       }, 0);
     } else {
       cart.products.push({
         product: productId,
         quantity: parseInt(quantity),
         price: product.price,
         total: product.price * parseInt(quantity),
       });
       cart.cartTotal += product.price * parseInt(quantity); 
     }
 
     await cart.save();
     const removedWishlistProduct = await WishlistDB.findOneAndUpdate(
      { user: req.session.userId },
      { $pull: { products: { product: productId } } },
      { new: true }
     );
     
     console.log(removedWishlistProduct, "sdfghj");
     
     res.json({ success: true });
  } catch (error) {
     console.log("InsertCartError", error);
     res.status(500).json({ success: false, message: "An error occurred while adding to cart." });
  }
 });
 



module.exports = {
  loadWishlist,
  addToWishList,
  checkProductInWishlist,
  removeItemFromWishlist,
  addToCartFromWishlist,
};
