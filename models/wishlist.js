const mongoose = require('mongoose');

var wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            }
        },
    ],
}, {
    timestamps: true,
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
