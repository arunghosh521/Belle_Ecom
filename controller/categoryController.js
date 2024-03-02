const asyncHandler = require("express-async-handler");
const CategoryDB = require("../models/category");

const loadAddCategory = asyncHandler(async (req, res) => {
  try {
    res.render("admin/addCategory");
  } catch (error) {
    console.log("addProductPageError", error);
  }
});

const loadCategory = asyncHandler(async (req, res) => {
  try {
    res.render("admin/category");
  } catch (error) {
    console.log("addProductPageError", error);
  }
});

const validateCategory = asyncHandler(async (req, res) => {
  try {
    const {catName, decpArea} = req.body;
    console.log("body Data", req.body);
    let response = {};
    const min_word = 10;
    const max_word = 100;
    if(catName && (catName.trim() === '' || catName.length < 3)) {
      response.caterogyStatus = "Category cannot be empty it must contain 3 or more letters";
      console.log("vdfvvfe",  response.caterogyStatus);
    }else if(catName && /[0-9]/.test(catName)) {
      response.caterogyStatus = "category cannot be conatin numbers";
    }else {
      response.caterogyStatus = " ";
    }
    if (decpArea) {
      const words = decpArea.trim().split(/\s+/);
      if (words.length < min_word) {
        response.descriptionStatus = `Category Description must contain at least ${min_word} words`;
      } else if (words.length > max_word) {
        response.descriptionStatus = `Category Description cannot exceed ${max_word} words`;
      }
    } else {
      response.descriptionStatus = "Category Description cannot be empty";
    }
        res.json(response); 

  } catch (error) {}
});

const categoryView = asyncHandler(async (req, res) => {
  try {
    const categories = await CategoryDB.find();
    res.render("admin/category", { categories });
  } catch (error) {
    console.log("productPageError", error);
  }
});

const addCategoryCntrl = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    //console.log(req.body);

    const existingCategory = await CategoryDB.findOne({ category: name });
    if (!existingCategory) {
      const newCategory = new CategoryDB({
        category: name,
        description: description,
      });
      //console.log("newCat", newCategory);
      //console.log("description", newCategory.description);

      const categories = await newCategory.save();
      //console.log("catData:", categories);
      res.json({success: true, message: 'Category added successfully'})
  
    } else {
      res.json({success: false, message: 'Category already exists.'})
      //console.log("Category already exists.");
    }
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const loadEditCategory = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    //console.log("CatID", id);
    const success = req.flash("Alrtmessage")[0];
    const categoryData = await CategoryDB.findById(id);
    res.render("admin/editCategory", { categoryData, message: success });
  } catch (error) {
    console.log("editCategoryError", error);
  }
});

const toggleListcategory = asyncHandler(async (req, res) => {
  try {
    //console.log("body", req.body);
    const { categoryId, isListed } = req.body;

    const categories = await CategoryDB.findByIdAndUpdate(
      categoryId,
      { is_listed: isListed },
      { new: true }
    );

    // console.log("Updated category:", categories);

    res.json({ success: true });
  } catch (error) {
    console.error("ToggleBlockUserError", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const updateCategoryCntrl = asyncHandler(async (req, res) => {
  try {
    const { name, categoryID, description } = req.body;
    //console.log(req.body);
    const existingCategory = await CategoryDB.findOne({
      category: { $regex: new RegExp("^" + name + "$", "i") },
    });
    //console.log("existCategory", existingCategory);
    if (existingCategory) {
      req.flash("Alrtmessage", "Category already exist !");
      const id = req.params.id;
      res.redirect(`/admin/category/editCategory/${id}`);
    } else {
      const updateCategory = await CategoryDB.findByIdAndUpdate(categoryID, {
        category: name,
        description: description,
      });
      res.redirect("/admin/category/listCategory");
    }
  } catch (error) {}
});

module.exports = {
  loadAddCategory,
  loadCategory,
  addCategoryCntrl,
  categoryView,
  loadEditCategory,
  updateCategoryCntrl,
  toggleListcategory,
  validateCategory,
};
