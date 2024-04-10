const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Product = require("../models/products");
const CategoryDB = require("../models/category");
const AdminDB = require("../models/userModel");
const { resizeAndSaveImages } = require("../middlewares/multer");

//* Load products page
const loadProducts = asyncHandler(async (req, res) => {
  try {
    const findAdmin = await AdminDB.find();
    res.render("admin/productView", { findAdmin });
  } catch (error) {
    console.log("productPageError", error);
  }
});

//* Load add products page
const loadAddProducts = asyncHandler(async (req, res) => {
  try {
    const success = req.flash("productMsg")[0];
    const category = await CategoryDB.find({ is_listed: true });
    const categoryData = Array.isArray(category) ? category : [];
    res.render("admin/addProduct", { categoryData, message: success});
  } catch (error) {
    console.log("addProductPageError", error);
  }
});

//* Load products listing page
const loadProductsView = asyncHandler(async (req, res) => {
  try {
    const success = req.flash("productMsg")[0];
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("category");
    res.render("admin/productView", { products, message: success});
  } catch (error) {
    console.log("productPageError", error);
  }
});

//* Pagination for products listing page
const paginationForProductView = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category");
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

//* Validation for add products fields
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
      response.pNameStatus =
        "Productname cannot be contain numbers and symbolys";
    } else {
      response.pNameStatus = "";
    }

    if (productPrice) {
      if (parseFloat(productPrice) < 0) {
        response.pPriceStatus = "Product Price cannot be a negative value";
      } else if (/[a-zA-Z]/.test(productPrice)) {
        response.pPriceStatus =
          "Product Price cannot contain alphabets or any other symbols";
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

//* Add products control
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

    if (
      !productName ||
      !productPrice ||
      !productQuantity ||
      !productDescription
    ) {
      req.flash("productMsg", "All fields required.");
     return res.redirect("/admin/product/addProduct");
    }

    const filenames = await resizeAndSaveImages(req.files);

    const findCategory = await CategoryDB.findOne({ category: category });
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

    res.redirect("/admin/product/listProduct");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

//* Load edit products page
const loadEditProducts = asyncHandler(async (req, res) => {
  try {
    const _id = req.params.id;
    const products = await Product.findById(_id).populate("category");
    const category = await CategoryDB.find({ is_listed: true });
    const categoryData = Array.isArray(category) ? category : [];
    res.render("admin/editProduct", { categoryData, products, productId: _id });
  } catch (error) {
    console.log("editProductError", error);
  }
});

//* Listing unlisting products
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

//* Edit Product control
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
    const filenames = await resizeAndSaveImages(req.files);
    const findCategory = await CategoryDB.findById(categoryID);

    const updateProduct = await Product.findByIdAndUpdate(
      productID,
      {
        $set: {
          name: productName,
          category: findCategory._id,
          price: productPrice,
          description: description,
          quantity: quantity,
          size: size,
          color: color,
          is_listed: true,
        },
        $push: {
          images: { $each: filenames.map((filename) => `${filename}`) },
        },
      },
      { new: true }
    );
    if (updateProduct.images.length > 5) {
      req.flash("productMsg", "Note: The product has more than 5 images.");
      return res.redirect(`/admin/product/editProduct/${productID}`);
    } else {
      req.flash("productMsg", "Product updated successfully");
      return res.redirect("/admin/product/listProduct");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

//* Deleting products from edit product page
const deleteImageControl = asyncHandler(async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const productId = req.query.id;

    const imageName = path.basename(imageUrl);

    const product = await Product.findByIdAndUpdate(productId, {
      $pull: { images: imageName },
    });

    const imagePath = `../Belle_Ecom/public${imageUrl}`;
    fs.unlink(imagePath, (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to delete image" });
      } else {
        res.status(200).json({ message: "Image deleted successfully" });
      }
    });
  } catch (error) {
    console.log("deletingImageError", error);
  }
});

//? Exporting modules to product route
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
  paginationForProductView,
};
