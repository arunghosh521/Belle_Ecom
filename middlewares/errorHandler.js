const User = require("../models/userModel");
const CartDB = require("../models/cart");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} = require("../middlewares/appError");

const notFound = async (req, res, next) => {
  try {
     if (req.session.adminID) {
       res.status(404).render("user/error", { errorMessage: "404 - Page not found" });
     } else if (req.session.userId) {
       const user = await User.findOne({ _id: req.session.userId });
       const cartProduct = await CartDB.findOne({
         orderBy: req.session.userId,
       }).populate("products.product");
       res.status(404).render("user/404", { user, cartProduct });
     } else {
       res.status(404).render("user/error", { errorMessage: "404 - Page not found" });
     }
  } catch (error) {
     next(error);
  }
 };
 
 

const errorHandler = async (err, req, res, next) => {
  console.error(err.stack, 'asdfghjk');
  let statusCode = err.statusCode || 500;
  let errorMessage =
    process.env.NODE_ENV === "production" ? "An error occurred" : err.message;
  const user = await User.findOne({ _id: req.session.userId });
  const cartProduct = await CartDB.findOne({
    orderBy: req.session.userId,
  }).populate("products.product");
  if (err instanceof NotFoundError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof BadRequestError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof InternalServerError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  }

  if (req.accepts("html")) {
    if (statusCode === 404) {
      res.status(404).render("user/404", { errorMessage, user, cartProduct });
    } else if (statusCode === 500) {
      res.status(500).render("user/500", { errorMessage });
    } else {
      res.status(statusCode).render("user/error", { errorMessage });
    }
  } else {
    // Send JSON response for other content types
    res.status(statusCode).json({ error: errorMessage });
  }
};

module.exports = { notFound, errorHandler };
