const express = require("express");
const productRoute = express.Router();
const productController = require("../controller/productController");
const userController = require("../controller/userController");

productRoute.get("", productController.loadProducts);
productRoute.post("/validateProduct", productController.validateProduct);
productRoute
  .route("/addProduct")
  .get(productController.loadAddProducts)
  .post(productController.addProductsCntrl);
productRoute.get("/listProduct", productController.loadProductsView);
productRoute.post("/editProduct/toggleList", productController.toggleListUser);
productRoute.get("/editProduct/:id", productController.loadEditProducts);
productRoute.post("/editProduct/:id", productController.updateEditProducts);

module.exports = productRoute;
