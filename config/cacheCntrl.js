

const cacheControl = (req, res, next) => {
  console.log('Cache control middleware executed');
    res.set('Cache-Control', 'no-store, no-cache');
    next();
  };

  module.exports = cacheControl;