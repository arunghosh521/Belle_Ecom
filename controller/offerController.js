const asyncHandler = require("express-async-handler");
const OfferDB = require("../models/offer");
const ProductDB = require("../models/products");
const categoryDB = require("../models/category");

//* Load create offer page
const loadCreateOffer = asyncHandler(async (req, res) => {
  try {
    res.render("admin/createOffer");
  } catch (error) {
    console.log("loadcreateOfferError", error);
  }
});

//* Create offer control
const createOfferControl = asyncHandler(async (req, res) => {
  try {
    const { title, percentage, startDate, endDate, description } = req.body;
    const alphanumericRegex = /^[a-zA-Z0-9]{6}$/;
    const numericRegex = /^\d+(\.\d+)?$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;
    const descriptionWords = description.split(/\s+/);

    //* Validation for fields
    if (!title || !percentage || !startDate || !endDate || !description) {
      return res.status(200).json({
        successValidation: false,
        message: "All fields are required.",
      });
    }

    if (!titleRegex.test(title)) {
      return res.status(200).json({
        successTitle: false,
        message:
          "Title must contain only letters and be at least 4 characters long.",
      });
    }

    if (!numericRegex.test(percentage) || parseFloat(percentage) > 100) {
      return res.status(200).json({
        successPercentage: false,
        message:
          "Percentage must be numbers and not greater than 100.",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (new Date(startDate) < currentDate) {
      return res.status(200).json({
        successDate: false,
        message: "The expiry date must not be earlier than today.",
      });
    }

    if (descriptionWords.length < 5 || descriptionWords.length > 15) {
      return res.status(200).json({
        successDescription: false,
        message: "Description must contain between 5 and 15 words.",
      });
    }

    const existingOffer = await OfferDB.findOne({ offerName: title });
    if (existingOffer) {
      return res
        .status(200)
        .json({ success: false, message: "Offer already exist." });
    }

    const newOffer = new OfferDB({
      offerName: title,
      percentage: percentage,
      startingDate: new Date(startDate),
      expiryDate: new Date(endDate),
      offerDescription: description,
      isListed: true,
    });

    const savedOffer = await newOffer.save();

    res.status(200).json({
      success: true,
      message: "Offer added successfully.",
      data: savedOffer,
    });
  } catch (error) {
    console.error("Error adding new offer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the offer.",
    });
  }
});

//* Load offer listing page
const loadOfferList = asyncHandler(async (req, res) => {
  try {
    const offerData = await OfferDB.find().sort({ createdAt: -1 });
    res.render("admin/offerList", { offerData });
  } catch (error) {
    console.log("loadOfferList", error);
  }
});

//* Delete offer control
const deleteOfferControl = asyncHandler(async (req, res) => {
  try {
    const { offerId } = req.body;
    const deletedOffer = await OfferDB.findByIdAndDelete(offerId);
    res
      .status(200)
      .json({ success: true, message: "Coupon Deleted successfully" });
  } catch (error) {}
});

//* Enable and disable offer
const statusChangeOfOffer = asyncHandler(async (req, res) => {
  try {
    const { offerId, status } = req.body;
    const offerID = { _id: offerId };
    const offer = await OfferDB.findOne(offerID);
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    const update = { isListed: status === "active" ? true : false };

    const changedCoupon = await OfferDB.findOneAndUpdate(offerID, update, {
      new: true,
    });
    res
      .status(200)
      .json({ success: true, message: "Status changed successfully" });
  } catch (error) {
    console.log("statusChangingErrorOfCoupon", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the status",
    });
  }
});

//* Load edit offer page
const loadEditOffer = asyncHandler(async (req, res) => {
  try {
    const offerId = req.query.id;
    const offerData = await OfferDB.findById(offerId);
    res.render("admin/editOffer", { offerData });
  } catch (error) {
    console.log("loadEditOfferError", error);
  }
});

//* Edit offer control
const editOfferControl = asyncHandler(async (req, res) => {
  try {
    const { title, percentage, startDate, endDate, description } = req.body;
    console.log("couponBodyData", startDate, endDate);
    const numericRegex = /^\d+$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;

    if (!title || !percentage || !startDate || !endDate || !description) {
      return res
        .status(200)
        .json({ success: false, message: "All fields are required." });
    }

    if (!titleRegex.test(title)) {
      return res.status(200).json({
        status: false,
        message:
          "Title must contain only letters and be at least 4 characters long.",
      });
    }

    if (!numericRegex.test(percentage)) {
      return res.status(200).json({
        success: false,
        message: "Percentage must be a valid number.",
      });
    }

    const descriptionWords = description.split(/\s+/);
    if (descriptionWords.length < 5 || descriptionWords.length > 15) {
      return res.status(200).json({
        success: false,
        message: "Description must contain between 5 and 15 words.",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (new Date(startDate) < currentDate) {
      return res.status(200).json({
        success: false,
        message: "The start and expiry date must not be earlier than today.",
      });
    }

    const existingOffer = await OfferDB.findOne({ offerName: title });
    if (existingOffer) {
      const hasChanges =
        existingOffer.percentage !== percentage ||
        existingOffer.startingDate.toISOString() !==
          new Date(startDate).toISOString() ||
        existingOffer.expiryDate.toISOString() !==
          new Date(endDate).toISOString() ||
        existingOffer.offerDescription !== description;

      if (hasChanges) {
        existingOffer.percentage = percentage;
        existingOffer.startingDate = new Date(startDate);
        existingOffer.expiryDate = new Date(endDate);
        existingOffer.offerDescription = description;
        existingOffer.isListed = true;

        const updatedOffer = await existingOffer.save();

        return res.status(200).json({
          success: true,
          message: "Offer updated successfully.",
          data: updatedOffer,
        });
      } else {
        return res.status(200).json({
          success: false,
          message:
            "No changes detected. Please make some changes to update the offer.",
        });
      }
    } else {
      return res.status(200).json({
        success: false,
        message: "Offer not found. Please check the offer name.",
      });
    }
  } catch (error) {
    console.error("Error editing offer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while editing the offer.",
    });
  }
});

//* Send offer details to offer modal
const offerDetailsControl = asyncHandler(async (req, res) => {
  try {
    const currentData = new Date();
    const offerDetails = await OfferDB.find({
      expiryDate: { $gte: currentData },
      isListed: true,
    });
    console.log(offerDetails,'asdfghjkl');
    res.status(200).json({ success: true, offerDetails });
  } catch (error) {
    console.log("offerDetailsError", error);
  }
});

//* Applying offer to product
const offerApplyingToProduct = asyncHandler(async (req, res) => {
  try {
    const { offerName, productId } = req.body;

    const productData = await ProductDB.findById(productId);
    const productPrice = productData.price;

    const offer = await OfferDB.findOne({ offerName: offerName });

    const expiryDate = new Date(offer.expiryDate);
    const currentDate = new Date();

    const offerAlreadyApplied = productData.offer.some(
      (offerId) => offerId.toString() === offerId._id.toString()
    );
    if (offerAlreadyApplied) {
      res.json({ success: true, message: "Offer already applied" });
      return;
    }

    const offerDiscount = offer.percentage;
    const discountAmount = (productPrice * offerDiscount) / 100;
    productData.offerPrice = productPrice - discountAmount;
    productData.offerApplied = true;
    productData.offer.push(offer);

    await productData.save();
    res.json({ success: true, message: "Offer applied successfully" });
  } catch (error) {
    console.log("applyOfferError", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while applying the offer",
    });
  }
});

//* Remove offer from product
const offerRemovingProduct = asyncHandler(async (req, res) => {
  try {
    const { offerName, productId } = req.body;
    const productData = await ProductDB.findById(productId);
    const productPrice = productData.price;

    const offer = await OfferDB.findOne({ offerName: offerName });
    const offerAlreadyApplied = productData.offer.some(
      (offerId) => offerId.toString() === offerId._id.toString()
    );

    if (offerAlreadyApplied && offer) {
      productData.offerPrice = 0;
      productData.offerApplied = false;
      productData.offer = [];
      await productData.save();
      res.json({ success: true, message: "Offer removed successfully" });
    } else {
      res.json({ success: false, message: "Offer not exist" });
    }
  } catch (error) {
    console.log("removeOfferError", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the offer",
    });
  }
});

//* Applying offer to categroy
const offerApplyingToCategory = asyncHandler(async (req, res) => {
  try {
    const { offerName, categoryId } = req.body;
    const categoryData = await categoryDB.findById(categoryId);
    const offer = await OfferDB.findOne({ offerName: offerName });
    const offerAlreadyApplied = categoryData.offer.some(
      (offerId) => offerId.toString() === offerId._id.toString()
    );
    if (offerAlreadyApplied) {
      res.json({ success: true, message: "Offer already applied" });
      return;
    }

    const products = await ProductDB.find({ category: categoryId });
    categoryData.offerApplied = true;
    categoryData.offer.push(offer);
    await categoryData.save();

    products.forEach(async (product) => {
      product.offerApplied = true;
      product.offer.push(offer);
      const highestOfferPercentage = await calculateHighestOfferPercentage(
        product
      );
      console.log(highestOfferPercentage);
      product.offerPrice =
        product.price - (product.price * highestOfferPercentage) / 100;
      await product.save();
    });

    res.json({ success: true, message: "Offer applied successfully" });
  } catch (error) {
    console.log("applyOfferError", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while applying the offer",
    });
  }
});

//? function for calculating the highest offer price
function calculateHighestOfferPercentage(product) {
  let highestPercentage = product.offer[0].percentage;

  product.offer.forEach((offer) => {
    if (offer.percentage > highestPercentage) {
      highestPercentage = offer.percentage;
    }
  });
  return highestPercentage;
}

//* Remove offer from categroy
const offerRemovingCategory = asyncHandler(async (req, res) => {
  try {
    const { offerName, categoryId } = req.body;
    const categoryData = await categoryDB.findById(categoryId);
    const offer = await OfferDB.findOne({ offerName: offerName });
    const offerAlreadyApplied = categoryData.offer.some(
      (offerId) => offerId.toString() === offerId._id.toString()
    );
    if (offerAlreadyApplied) {
      const products = await ProductDB.find({ category: categoryId });
      categoryData.offerApplied = false;
      categoryData.offer = [];
      await categoryData.save();

      products.forEach(async (product) => {
        product.offerApplied = false;
        product.offer = [];
        product.offerPrice = 0;
        await product.save();
      });
      res.json({ success: true, message: "Offer removed successfully" });
    } else {
      res.json({ success: false, message: "Offer not exist" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the offer",
    });
  }
});

//? Export modules to offer route
module.exports = {
  loadCreateOffer,
  createOfferControl,
  loadOfferList,
  deleteOfferControl,
  statusChangeOfOffer,
  loadEditOffer,
  editOfferControl,
  offerDetailsControl,
  offerApplyingToProduct,
  offerApplyingToCategory,
  offerRemovingProduct,
  offerRemovingCategory,
};
