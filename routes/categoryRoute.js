const express = require("express");
const catRoute = express.Router();
const categoryController = require("../controller/categoryController");
const {isLogin} = require("../middlewares/adminAuth");

catRoute.get("", isLogin, categoryController.loadCategory);
catRoute
  .route("/addCategory")
  .get(isLogin, categoryController.loadAddCategory)
  .post(categoryController.addCategoryCntrl);
catRoute.get("/listCategory", isLogin, categoryController.categoryView);
catRoute
  .route("/editCategory/:id")
  .get(isLogin, categoryController.loadEditCategory)
  .post(categoryController.updateCategoryCntrl);
catRoute.post('/categoryToggleList', categoryController.toggleListcategory)
catRoute.post('/validateCategory', categoryController.validateCategory)

module.exports = catRoute;
