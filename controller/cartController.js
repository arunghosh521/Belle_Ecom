const asyncHandler = require("express-async-handler");
const CartDB = require("../models/cart");
const UserDB = require("../models/userModel");
const ProductDB = require("../models/products");
const AddressDB = require("../models/address");
const CouponDB = require("../models/coupon");
const WalletDB = require("../models/wallet");
const WishlistDB = require("../models/wishlist");
const mongoose = require("mongoose");

//* Load user cart
const loadUserCart = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    res.render("user/userCart", { user: userData, cartProduct });
  } catch (error) {
    console.log("userCartError", error);
  }
});

//* Insert a product to cart from product detail page
const insertCartItem = asyncHandler(async (req, res) => {
  try {
    const { quantity, productId, couponCode } = req.body;
    const product = await ProductDB.findById(productId).populate("offer");

    if (!product) {
      return res.json({ success: false, message: "Product not Found" });
    }
    if (quantity > product.quantity) {
      return res.json({ success: false, message: "Product Quantity Exceeded" });
    }

    const removedWishlistProduct = await WishlistDB.findOneAndUpdate(
      { user: req.session.userId },
      { $pull: { products: { product: productId } } },
      { new: true }
    );

    let cart = await CartDB.findOne({ orderBy: req.session.userId });
    if (!cart) {
      cart = new CartDB({
        products: [],
        cartTotal: 0,
        orderBy: req.session.userId,
      });
      await cart.save();
    }
    const existingProduct = cart.products.find(
      (item) => item.product.toString() === productId
    );

    const priceToUse =
      product.offer && product.offerApplied === true
        ? product.offerPrice
        : product.price;
    const offerStatusInCart =
      product.offer && product.offerApplied === true ? true : false;
    if (couponCode) {
      const coupon = await CouponDB.findOne({
        couponCode: couponCode,
        status: true,
      });
      if (coupon && cart.cartTotal >= coupon.minAmount) {
        cart.cartTotal -= coupon.discountAmount;
        cart.couponApplied = true;
      } else {
        const userId = req.session.userId;
        const userObjectId = mongoose.Types.ObjectId(userId);
        const updatedCoupon = await CouponDB.updateOne(
          {
            couponCode: couponCode,
          },
          { $pull: { userUsed: { user_id: userObjectId } } }
        );
        cart.couponApplied = false;
      }
    }

    if (existingProduct) {
      if (existingProduct.quantity + parseInt(quantity) > product.quantity) {
        return res.json({
          success: false,
          message: "Product Quantity Exceeded",
        });
      } else {
        existingProduct.quantity += parseInt(quantity);
        cart.cartTotal = cart.products.reduce((total, product) => {
          return total + product.quantity * product.price;
        }, 0);
      }
    } else {
      cart.products.push({
        product: productId,
        quantity: quantity,
        price: priceToUse,
        total: priceToUse * quantity,
        offer: offerStatusInCart,
      });
      cart.cartTotal += priceToUse * quantity;
    }

    await cart.save();

    res.json({ success: true });
  } catch (error) {
    console.log("InsertCartError", error);
  }
});

//* Updating quantities of product from the cart page
const cartUpdate = asyncHandler(async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const productDetails = await ProductDB.findById(productId);
    const existingCart = await CartDB.findOne({ orderBy: req.session.userId });
    const existingProduct = existingCart.products.find((product) =>
      product.product.equals(mongoose.Types.ObjectId(productId))
    );

    const priceToUse =
      existingProduct.offer && existingProduct.offerApplied === true
        ? existingProduct.offerPrice
        : existingProduct.price;

    if (existingCart && existingProduct && productDetails.is_listed === true) {
      const newQuantity = quantity + existingProduct.quantity;
      if (newQuantity <= productDetails.quantity) {
        existingProduct.quantity = newQuantity;
        existingProduct.total = existingProduct.quantity * priceToUse;
        existingCart.cartTotal += quantity * priceToUse;
        await existingCart.save();

        return res.json({
          success: true,
          message: "Quantity Updated successfully",
        });
      } else {
        return res.json({
          stockErr: true,
          message: "Requested quantity exceeds available quantity",
        });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in the cart" });
    }
  } catch (error) {
    console.error("cartUpdateError:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//* Removing product from the cart
const removeCartItem = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    const findProduct = await CartDB.findOneAndUpdate(
      { "products._id": productId },
      { $pull: { products: { _id: productId } } },
      { new: true }
    );
    if (!findProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not Found" });
    }
    let totalPrice = 0;
    findProduct.products.forEach((product) => {
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

//* Load the checkout page
const loadCheckout = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const couponList = await CouponDB.find({
      status: true,
      Availability: { $gt: 0 },
      userUsed: { $not: { $elemMatch: { user_id: req.session.userId } } },
    });
    const addressData = await AddressDB.find({ user: req.session.userId });
    const walletData = await WalletDB.findOne({ user: req.session.userId });
    res.render("user/checkout", {
      user: userData,
      cartProduct,
      addressData,
      couponList,
      walletData,
    });
  } catch (error) {
    console.log("checkOutError", error);
  }
});

//* Apply coupon control
const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userId;
    const userObjectId = mongoose.Types.ObjectId(userId);
    if (!couponCode || couponCode.length < 5 || couponCode.length > 5) {
      return res.status(200).json({
        success: false,
        message: "coupon code must contain 6 charachters",
      });
    }

    const userCart = await CartDB.findOne({ orderBy: userId });
    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const couponDetails = await CouponDB.findOne({ couponCode: couponCode });
    if (!couponDetails) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon not found" });
    }
    const alreadyUsedCoupon = await CouponDB.findOne({
      userUsed: { $elemMatch: { user_id: userObjectId } },
    });
    const userHasUsedCoupon = couponDetails.userUsed.some((user) =>
      user.user_id.equals(userObjectId)
    );
    if (userHasUsedCoupon) {
      return res
        .status(200)
        .json({ sucess: false, message: "You have already used this coupon." });
    }
    if (userCart.couponApplied) {
      userCart.cartTotal += userCart.discountAmount;
      userCart.couponApplied = false;
      userCart.discountAmount = 0;
      userCart.couponCode = '';
      await userCart.save();
      await alreadyUsedCoupon.updateOne({
        $pull: {
          userUsed: { user_id: userObjectId },
        },
      });

      alreadyUsedCoupon.Availability++;
      await alreadyUsedCoupon.save();
    }

    const cartTotal = userCart.cartTotal;

    const { discountAmount, minAmount } = couponDetails;

    if (cartTotal >= minAmount) {
      userCart.cartTotal -= discountAmount;
      userCart.couponApplied = true;
      userCart.discountAmount = discountAmount;
      userCart.couponCode = couponCode;
      await userCart.save();
      couponDetails.userUsed.push({ user_id: userId });
      couponDetails.Availability--;
      await couponDetails.save();

      return res.status(200).json({
        success: true,
        discountAmt: couponDetails,
        cartDetails: userCart,
        message: "Coupon applied successfully",
      });
    } else {
      return res.status(200).json({
        success: false,
        message:
          "Total amount is not greater than the minimum amount required for the coupon",
      });
    }
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//* Remove Coupon
const removeCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userId;
    const userCart = await CartDB.findOne({ orderBy: userId });

    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const couponDetails = await CouponDB.findOne({ couponCode: couponCode });
    if (!couponDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    } else {
      userCart.cartTotal += couponDetails.discountAmount;
      userCart.couponApplied = false;
      userCart.discountAmount = 0;
      userCart.save();
      const userObjectId = mongoose.Types.ObjectId(userId);
      couponDetails.userUsed.pull({ user_id: userObjectId });
      couponDetails.Availability++;
      await couponDetails.save();

      return res.status(200).json({
        success: true,
        cartDetails: userCart,
        message: "Coupon removed!",
      });
    }
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//? Exporting modules to cart route
module.exports = {
  loadUserCart,
  insertCartItem,
  loadCheckout,
  cartUpdate,
  removeCartItem,
  applyCoupon,
  removeCoupon,
};
