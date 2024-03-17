const asyncHandler = require("express-async-handler");
const CouponDb = require("../models/coupon");

const loadCreateCoupon = asyncHandler(async (req, res) => {
  try {
    res.render("admin/createCoupon");
  } catch (error) {
    console.log("loadCouponError", error);
  }
});

const addNewCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      code,
      endDate,
      availability,
      discountAmount,
      minimumAmount,
      description,
    } = req.body;
    console.log("couponBodyData", req.body);
    const alphanumericRegex = /^[a-zA-Z0-9]{6}$/;
    const numericRegex = /^\d+$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;

    if (
      !title ||
      !code ||
      !endDate ||
      !availability ||
      !discountAmount ||
      !minimumAmount ||
      !description
    ) {
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

    if (!alphanumericRegex.test(code)) {
      return res.status(200).json({
        success: false,
        message:
          "Coupon code must be exactly 6 characters long and can only contain alphabets and numbers.",
      });
    }

    if (!numericRegex.test(discountAmount)) {
      return res
        .status(200)
        .json({ success: false, message: "Discount amount must be a number." });
    }

    if (!numericRegex.test(minimumAmount)) {
      return res
        .status(200)
        .json({ success: false, message: "Minimum amount must be a number." });
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
    if (new Date(endDate) < currentDate) {
      return res.status(200).json({
        success: false,
        message: "The expiry date must not be earlier than today.",
      });
    }

    const existingCoupon = await CouponDb.findOne({ couponCode: code });
    if (existingCoupon) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon code already exist." });
    }

    const newCoupon = new CouponDb({
      couponName: title,
      couponCode: code,
      discountAmount: parseFloat(discountAmount),
      minAmount: parseFloat(minimumAmount),
      couponDescription: description,
      Availability: availability,
      expiryDate: new Date(endDate),
      status: true,
      userUsed: [],
    });

    const savedCoupon = await newCoupon.save();
    console.log("savedcoupon", savedCoupon);

    res.status(201).json({
      success: true,
      message: "Coupon added successfully.",
      data: savedCoupon,
    });
  } catch (error) {
    console.error("Error adding new coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the coupon.",
    });
  }
});

const loadCouponList = asyncHandler(async (req, res) => {
  try {
    const couponData = await CouponDb.find();
    res.render("admin/couponList", { couponData });
  } catch (error) {
    console.log("loadCouponError", error);
  }
});

const loadCouponEdit = asyncHandler(async (req, res) => {
  try {
    const couponId = req.query.id;
    console.log("coouponId", couponId);
    const coupon = await CouponDb.findById(couponId);
    console.log("couponData", coupon);
    res.render("admin/editCoupon", { coupon });
  } catch (error) {
    console.log("LoadEditCouponError", error);
  }
});

const editCouponControl = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      couponID,
      code,
      endDate,
      availability,
      discountAmount,
      minimumAmount,
      description,
    } = req.body;
    console.log("couponBodyData", req.body);
    const alphanumericRegex = /^[a-zA-Z0-9]{6}$/;
    const numericRegex = /^\d+$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;

    if (
      !title ||
      !code ||
      !endDate ||
      !availability ||
      !discountAmount ||
      !minimumAmount ||
      !description
    ) {
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

    if (!alphanumericRegex.test(code)) {
      return res.status(200).json({
        success: false,
        message:
          "Coupon code must be exactly 6 characters long and can only contain alphabets and numbers.",
      });
    }

    if (!numericRegex.test(discountAmount)) {
      return res
        .status(200)
        .json({ success: false, message: "Discount amount must be a number." });
    }

    if (!numericRegex.test(minimumAmount)) {
      return res
        .status(200)
        .json({ success: false, message: "Minimum amount must be a number." });
    }

    const descriptionWords = description.split(/\s+/);
    if (descriptionWords.length > 15) {
      return res.status(200).json({
        success: true,
        message: "Description must contain between 5 and 15 words.",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (new Date(endDate) < currentDate) {
      return res.status(200).json({
        success: false,
        message: "The expiry date must not be earlier than today.",
      });
    }

    const existingCoupon = await CouponDb.findOne({
      couponCode: code,
      _id: { $ne: couponID },
    });
    if (existingCoupon) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon code already exist." });
    }

    const updatedCoupon = await CouponDb.findByIdAndUpdate(couponID, {
      couponName: title,
      couponCode: code,
      discountAmount: parseFloat(discountAmount),
      minAmount: parseFloat(minimumAmount),
      couponDescription: description,
      Availability: availability,
      expiryDate: new Date(endDate),
      status: true,
      userUsed: [],
    });
    console.log("updatedCoupon", updatedCoupon);
    res.status(201).json({
      success: true,
      message: "Coupon updated successfully.",
      data: updatedCoupon,
    });
  } catch (error) {
    console.log("editCouponError", error);
  }
});

const deleteCouponControl = asyncHandler(async(req,res) => {
  try {
    const {couponId} =req.body;
    console.log("id", couponId);
    const deletedcoupon = await CouponDb.findByIdAndDelete(couponId);
    console.log("deleted", deletedcoupon);
    res.status(200).json({success: true, message: 'Coupon Deleted successfully'})
  } catch (error) {
    console.log("errorDeletingCoupon", error);
  }
});

const statusChangeOfCoupon = asyncHandler(async(req, res) => {
  try {
     const { couponID, status } = req.body;
     console.log(req.body);
     const couponId = { _id: couponID }; 
     const coupon = await CouponDb.findOne(couponId);
     if (!coupon) {
       return res.status(404).json({ success: false, message: 'Coupon not found' });
     }

     if (coupon.Availability === 0) {
       return res.status(200).json({ success: false, message: 'Coupon is not available for status change' });
     }
     const update = { status: status === 'active' ? true : false }; 
 
     const changedCoupon = await CouponDb.findOneAndUpdate(couponId, update, { new: true });
     res.status(200).json({ success: true, message: 'Status changed successfully' });
  } catch (error) {
     console.log("statusChangingErrorOfCoupon", error);
     res.status(500).json({ success: false, message: 'An error occurred while changing the status' });
  }
 });
 

module.exports = {
  loadCreateCoupon,
  loadCouponList,
  addNewCoupon,
  loadCouponEdit,
  editCouponControl,
  deleteCouponControl,
  statusChangeOfCoupon,
};
