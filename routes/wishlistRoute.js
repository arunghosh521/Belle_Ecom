const express = require('express');
const wishRouter = express.Router();
const wishlistController = require('../controller/wishlistController');
const { isLogin, isLogout } = require("../middlewares/adminAuth");

wishRouter.get('', wishlistController.loadWishlist);
wishRouter.post('/add-to-wishlist', wishlistController.addToWishList);
wishRouter.post('/checkProduct', wishlistController.checkProductInWishlist);
wishRouter.post('/add-to-cart', wishlistController.addToCartFromWishlist);
wishRouter.delete('/removeItem', wishlistController.removeItemFromWishlist);



module.exports = wishRouter;