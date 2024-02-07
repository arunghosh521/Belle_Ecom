const User = require("../models/userModel");

const notFound = async (req, res, next) => {
  try {
    res.status(404);
    const user = await User.findOne({ _id: req.session.userId });
    // Redirect or render a view for the user
    res.render("user/404", { user });
  } catch (error) {
    next(error); // Forward the error to the error handling middleware
  }
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  if (req.accepts("html")) {
    res.status(statusCode).render("error", { error: err.message });
  } else if (req.accepts("json")) {
    res.status(statusCode).json({ error: err.message });
  } else {
    res.status(statusCode).send(`Error: ${err.message}`);
  }
};

module.exports = { notFound, errorHandler };
