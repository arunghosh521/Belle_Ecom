const User = require("../models/userModel");
const CartDB = require("../models/cart");

const notFound = async (req, res, next) => {
  try {
    res.status(404);
    const user = await User.findOne({ _id: req.session.userId });
    const cartProduct = await CartDB.findOne({
      orderBy: req.session.userId,
    }).populate("products.product");
    res.render("user/404", { user, cartProduct });
  } catch (error) {
    next(error); 
  }
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  if (req.accepts("html")) {
    res.status(statusCode).render("error");
  } else if (req.accepts("json")) {
    res.status(statusCode).json({ error: err.message });
  } else {
    res.status(statusCode).send(`Error: ${err.message}`);
  }
};

module.exports = { notFound, errorHandler };
