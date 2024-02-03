const express = require("express");
const catRoute = express.Router();
const categoryController = require("../controller/categoryController");

catRoute.get("", categoryController.loadCategory);
catRoute
  .route("/addCategory")
  .get(categoryController.loadAddCategory)
  .post(categoryController.addCategoryCntrl);
catRoute.get("/listCategory", categoryController.CategoryView);
catRoute
  .route("/editCategory/:id")
  .get(categoryController.loadEditCategory)
  .post(categoryController.updateCategoryCntrl);
catRoute.post('/categoryToggleList', categoryController.toggleListcategory)

module.exports = catRoute;
