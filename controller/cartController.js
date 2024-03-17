const asyncHandler = require("express-async-handler");
const CartDB = require("../models/cart");
const UserDB = require("../models/userModel");
const ProductDB = require("../models/products");
const AddressDB = require("../models/address");
const CouponDB = require("../models/coupon");
const WalletDB = require("../models/Wallet");
const mongoose = require("mongoose");

const loadUserCart = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    //console.log("product ID");
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");

    //console.log("singleProduct", cartProduct.products.length);
    res.render("user/userCart", { user: userData, cartProduct });
  } catch (error) {
    console.log("userCartError", error);
  }
});

const insertCartItem = asyncHandler(async (req, res) => {
  try {
    const { quantity, productId, couponCode } = req.body;
    console.log("bodyDataCArt", req.body);
    const product = await ProductDB.findById(productId).populate("offer");
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

    const priceToUse =
      product.offer && product.offerApplied === true
        ? product.offerPrice
        : product.price;
    console.log("price used", priceToUse);

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

        console.log("updatedCoupon", updatedCoupon);
      }
    }

    if (existingProduct) {
      existingProduct.quantity += parseInt(quantity);
      cart.cartTotal = cart.products.reduce((total, product) => {
        return total + product.quantity * product.price;
      }, 0);
    } else {
      cart.products.push({
        product: productId,
        quantity: quantity,
        price: priceToUse,
        total: priceToUse * quantity,
      });
      cart.cartTotal += priceToUse * quantity;
    }
  
    await cart.save();

    res.json({ success: true });
  } catch (error) {
    console.log("InsertCartError", error);
  }
});

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
    console.log("price used", priceToUse);

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

const loadCheckout = asyncHandler(async (req, res) => {
  try {
    const userData = await UserDB.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    const couponList = await CouponDB.find({ status: true });
    //console.log("coupon", couponList);
    const addressData = await AddressDB.find({ user: req.session.userId });
    //console.log(addressData);
    const walletData = await WalletDB.findOne({user: req.session.userId});
    console.log("walletData", walletData);
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

const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userId;
    const userObjectId = mongoose.Types.ObjectId(userId);
    console.log(userId);
    if (!couponCode || couponCode.length < 6 || couponCode.length > 6) {
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

    const userHasUsedCoupon = couponDetails.userUsed.some((user) =>
      user.user_id.equals(userObjectId)
    );
    console.log("bddvis", userHasUsedCoupon);
    if (userHasUsedCoupon) {
      return res
        .status(200)
        .json({ sucess: false, message: "You have already used this coupon." });
    }

    const cartTotal = userCart.cartTotal;

    const { discountAmount, minAmount } = couponDetails;

    if (cartTotal >= minAmount) {
      userCart.cartTotal -= discountAmount;
      userCart.couponApplied = true;
      await userCart.save();
      couponDetails.userUsed.push({ user_id: userId });
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
      userCart.save();
      const userObjectId = mongoose.Types.ObjectId(userId);
      couponDetails.userUsed.pull({ user_id: userObjectId });
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

module.exports = {
  loadUserCart,
  insertCartItem,
  loadCheckout,
  cartUpdate,
  removeCartItem,
  applyCoupon,
  removeCoupon,
};
