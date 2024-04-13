const express = require("express");
const productRoute = express.Router();
const productController = require("../controller/productController");
const { isLogin, isLogout } = require("../middlewares/adminAuth");
const multerMiddleware = require("../middlewares/multer");

productRoute.get("", isLogin, productController.loadProducts);
productRoute.post("/validateProduct", productController.validateProduct);
productRoute
  .route("/addProduct")
  .get(isLogin, productController.loadAddProducts)
  .post(
    multerMiddleware.uploads.array("image", 5),
    productController.addProductsCntrl
  );
productRoute.get("/listProduct", isLogin, productController.loadProductsView);
productRoute.get("/pagination", isLogin, productController.paginationForProductView);
productRoute.post("/editProduct/toggleList", productController.toggleListUser);
productRoute.get("/editProduct/:id", isLogin, productController.loadEditProducts);
productRoute.post(
  "/editProduct/:id",
  multerMiddleware.uploads.array("image", 5),
  productController.updateEditProducts
);
productRoute.delete("/deleteImage", productController.deleteImageControl);


module.exports = productRoute;
