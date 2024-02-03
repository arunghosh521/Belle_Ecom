const asyncHandler = require("express-async-handler");
const Product = require("../models/addProducts");
const CategoryDB = require("../models/category");
const AdminDB = require("../models/userModel");
const multer = require("multer");
const storage = multer.memoryStorage();
const uploads = multer({ storage: storage }).array("images", 5);
const sharp = require("sharp");

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

    if (productQuantity) {
      if (parseFloat(productQuantity) < 0) {
        response.pQuantityStatus =
          "Product Quantity cannot be a negative value";
      }
    } else {
      response.pQuantityStatus = "Product Quantity cannot be Empty";
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
  uploads(req, res, async (err) => {
    var filenames = [];
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

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
      console.log("prdtData:", req.body);

      const sharpPromises = req.files.map(async (file, index) => {
        const filename = `image_${index + 1}.${
          file.originalname
        },${Date.now()}.jpg`;
        const imagePath = `public/uploads/${filename}`;

        await sharp(file.buffer)
          .resize(300, 250, {
            fit: "contain",
            withoutEnlargement: true,
            background: "white",
          })
          .toFile(imagePath, { quality: 90 });

        filenames.push(filename);
      });

      // Wait for all sharpPromises to resolve before creating the Product
      await Promise.all(sharpPromises);

      const findCategory = await CategoryDB.findOne({ category: category });
      console.log("findCategory:", findCategory);
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
      });

      await products.save();

      //const product = await Product.find();

      res.redirect("/admin/product/listProduct");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

const loadEditProducts = asyncHandler(async (req, res) => {
  try {
    const _id = req.params.id;
    //console.log("ID:", _id);
    const products = await Product.findById(_id).populate('category');
    console.log('product',products);
    const category = await CategoryDB.find({ is_listed: true });
   
    const categoryData = Array.isArray(category) ? category : [];
   // console.log("sfvd", categoryData);
    res.render("admin/editProduct", { categoryData, products });
  } catch (error) {
    console.log("editProductError", error);
  }
});

const toggleListUser = asyncHandler(async (req, res) => {
  try {
    console.log("body", req.body);
    const { productId, isListed } = req.body;

    const products = await Product.findByIdAndUpdate(
      productId,
      { is_listed: isListed },
      { new: true }
    );

    console.log("Updated user:", products);

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
      category,
      size,
      color,
    } = req.body;
    console.log("prdtData:", req.body);
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp("^" + productName + "$", "i") },
    });
    console.log(
      "existPrdt",
      productName,
      existingProduct.category,
      existingProduct.name,
      category
    );
    if (
      existingProduct.name == productName &&
      existingProduct.category == category
    ) {
      req.flash("productMsg", "Product already exist");
      console.log("haii..");
      const id = req.params.id;
      res.redirect(`/admin/product/editProduct/${id}`);
    } else {
      const findCategory = await CategoryDB.findById({ _id: category });
      console.log("findCategory:", findCategory);
      const updateProduct = await Product.findByIdAndUpdate(productID, {
        name: productName,
        category: findCategory._id,
        price: productPrice,
        description: description,
        quantity: quantity,
        size: size,
        color: color,
        is_listed: true,
      });
      console.log("ProductUpdated", updateProduct);
      req.flash("productMsg", "Product updated successfully");
      res.redirect("/admin/product/listProduct");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = {
  loadProducts,
  loadAddProducts,
  validateProduct,
  addProductsCntrl,
  loadProductsView,
  loadEditProducts,
  toggleListUser,
  updateEditProducts,
};
