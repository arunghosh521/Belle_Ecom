const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');
const Product = require("../models/products");
const CategoryDB = require("../models/category");
const AdminDB = require("../models/userModel");
const {resizeAndSaveImages} = require('../middlewares/multer');
const { log } = require("sharp/lib/libvips");
const loadProducts = asyncHandler(async (req, res) => {
  try {
    const findAdmin = await AdminDB.find();
    res.render("admin/productView", { findAdmin });
  } catch (error) {
    console.log("productPageError", error);
  }
});

const loadAddProducts = asyncHandler(async (req, res) => {
  try {
    const category = await CategoryDB.find({ is_listed: true });
    const categoryData = Array.isArray(category) ? category : [];
    res.render("admin/addProduct", { categoryData });
  } catch (error) {
    console.log("addProductPageError", error);
  }
});

const loadProductsView = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    // console.log('products',products);
    res.render("admin/productView", { products });
  } catch (error) {
    console.log("productPageError", error);
  }
});

const validateProduct = asyncHandler(async (req, res) => {
  try {
    const { productName, productPrice, productQuantity, productDescription } =
      req.body;

    let response = {};
    const min_word = 10;
    const max_word = 100;

    if (productName && (productName.trim() === "" || productName.length < 3)) {
      response.pNameStatus =
        "Productname cannot be Empty it must contain 3 or more letters";
    } else if (productName && /[0-9]/.test(productName)) {
      response.pNameStatus = "Productname cannot be contain numbers and symbolys";
    } else {
      response.pNameStatus = "";
    }

    if (productPrice) {
      if (parseFloat(productPrice) < 0) {
        response.pPriceStatus = "Product Price cannot be a negative value";
      } else if (/[a-zA-Z]/.test(productPrice)) {
        response.pPriceStatus = "Product Price cannot contain alphabets or any other symbols";
      } else {
        response.pPriceStatus = "";
      }
    } else {
      response.pPriceStatus = "Product Price cannot be Empty";
    }

    if (productQuantity === undefined || productQuantity.trim() === "") {
      response.pQuantityStatus = "Product Quantity cannot be empty or Zero";
  } else {
      const parsedQuantity = parseFloat(productQuantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          response.pQuantityStatus = "Product Quantity must be a positive number";
      }
  }
  

    if (productDescription) {
      const words = productDescription.trim().split(/\s+/);
      if (words.length < min_word) {
        response.pDescriptionStatus = `Product Description must contain at least ${min_word} words`;
      } else if (words.length > max_word) {
        response.pDescriptionStatus = `Product Description cannot exceed ${max_word} words`;
      }
    } else {
      response.pDescriptionStatus = "Product Description cannot be empty";
    }
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

const addProductsCntrl = asyncHandler(async (req, res) => {
    try {
      const {
        productName,
        description,
        quantity,
        productPrice,
        category,
        size,
        color,
      } = req.body;
      console.log('prdtData:', req.body);

      console.log("imagesfromsystem", req.files);
      const filenames = await resizeAndSaveImages(req.files);

      const findCategory = await CategoryDB.findOne({ category: category });
      console.log('findCategory:', findCategory);
      const products = new Product({
        name: productName,
        category: findCategory._id,
        price: productPrice,
        description: description,
        quantity: quantity,
        size: size,
        color: color,
        is_listed: true,
        images: filenames.map((filename) => `${filename}`),
        sold: 0,
      });

      await products.save();

      res.redirect('/admin/product/listProduct');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });


const loadEditProducts = asyncHandler(async (req, res) => {
  try {
    const _id = req.params.id;
    //console.log("ID:", _id);
    const products = await Product.findById(_id).populate('category');
    console.log("product Data", products);

    const category = await CategoryDB.find({ is_listed: true });
   
    const categoryData = Array.isArray(category) ? category : [];
   //console.log("Category Data", categoryData);
    res.render("admin/editProduct", { categoryData, products, productId: _id });
  } catch (error) {
    console.log("editProductError", error);
  }
});

const toggleListUser = asyncHandler(async (req, res) => {
  try {
    const { productId, isListed } = req.body;

    const products = await Product.findByIdAndUpdate(
      productId,
      { is_listed: isListed },
      { new: true }
    );


    res.json({ success: true });
  } catch (error) {
    console.error("ToggleBlockUserError", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const updateEditProducts = asyncHandler(async (req, res) => {
  try {
    const {
      productName,
      description,
      quantity,
      productPrice,
      productID,
      categoryID, 
      size,
      color,
    } = req.body;
console.log("bodydataFromeditProduct", req.body);
    const filenames = await resizeAndSaveImages(req.files)
    const findCategory = await CategoryDB.findById(categoryID);

    const updateProduct = await Product.findByIdAndUpdate(productID, {
      name: productName,
      category: findCategory._id,
      price: productPrice,
      description: description,
      quantity: quantity,
      size: size,
      color: color,
      is_listed: true,
      images: filenames.map((filename) => `${filename}`),
    });

    console.log("ProductUpdated", updateProduct);
    req.flash("productMsg", "Product updated successfully");
    res.redirect("/admin/product/listProduct");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


const deleteImageControl = asyncHandler(async(req,res) => {
  try {
    console.log("deleteImage");
    const {imageUrl} = req.body;
    console.log("bodyData:", imageUrl);
    const productId = req.query.id; 
    console.log("bodyData:", req.query);

    const imageName = path.basename(imageUrl);
    console.log("imageName:", imageName);

    const product = await Product.findByIdAndUpdate(productId, {$pull:{images: imageName}});

    const imagePath = `../Belle_Ecom/public${imageUrl}`
    console.log("imagePath", imagePath);
    fs.unlink(imagePath, (err) => {
      if(err) {
        console.log("Error deleting image:", err);
        res.status(500).json({error: 'Failed to delete image'});
      }else{
        res.status(200).json({message: 'Image deleted successfully'});
      }
    });
  } catch (error) {
    console.log("deletingImageError", error);
  }
})


module.exports = {
  loadProducts,
  loadAddProducts,
  validateProduct,
  addProductsCntrl,
  loadProductsView,
  loadEditProducts,
  toggleListUser,
  updateEditProducts,
  deleteImageControl,
};
