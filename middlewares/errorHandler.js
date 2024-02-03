const notFound = (req, res, next) => {
    const error = new Error(`Not Found: ${req.originalUrl}`);
    res.status(404);
  
    // Set flash message for the error
    req.flash('error_msg', 'Page not found');
  
    // Redirect or render a view for the user
    res.render('user/404'); // Update the route or customize the view path accordingly
  };
  
  const errorHandler = (err, req, res, next) => {
    console.error(err);
  
    // Set flash message for the error
    req.flash('error_msg', 'Internal Server Error');
  
    // Redirect or render a view for the user
    res.redirect('/error'); // Update the route or customize the view path accordingly
  };
  
  module.exports = { notFound, errorHandler };
  