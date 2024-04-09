const asyncHandler = require("express-async-handler");
const CouponDb = require("../models/coupon");
var voucher_codes = require("voucher-code-generator");

//* Load create coupon code page
const loadCreateCoupon = asyncHandler(async (req, res) => {
  try {
    res.render("admin/createCoupon");
  } catch (error) {
    console.log("loadCouponError", error);
  }
});

//* Add new coupon control
const addNewCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      endDate,
      availability,
      discountAmount,
      minimumAmount,
      description,
    } = req.body;

    const numericRegex = /^\d+$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;

    if (
      !title ||
      !endDate ||
      !availability ||
      !discountAmount ||
      !minimumAmount ||
      !description
    ) {
      return res
        .status(200)
        .json({
          successValidation: false,
          message: "All fields are required.",
        });
    }

    if (!titleRegex.test(title)) {
      return res.status(200).json({
        statusTitle: false,
        message:
          "Title must contain only letters and be at least 4 characters long.",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (new Date(endDate) < currentDate) {
      return res.status(200).json({
        successDate: false,
        message: "The expiry date must not be earlier than today.",
      });
    }

    if (!numericRegex.test(discountAmount)) {
      return res
        .status(200)
        .json({
          successDiscount: false,
          message: "Discount amount must be a number.",
        });
    }

    if (!numericRegex.test(minimumAmount)) {
      return res
        .status(200)
        .json({
          successMinAmt: false,
          message: "Minimum amount must be a number.",
        });
    } 
     if (minimumAmount <= discountAmount) {
      return res
        .status(200)
        .json({
          successMinAmt: false,
          message: "Minimum amount cannot be less than or equals the discount amount.",
        });
    }

    const descriptionWords = description.split(/\s+/);
    if (descriptionWords.length < 5 || descriptionWords.length > 15) {
      return res.status(200).json({
        successDescription: false,
        message: "Description must contain between 5 and 15 words.",
      });
    }

    const existingCoupon = await CouponDb.findOne({ couponName: title });
    if (existingCoupon) {
      return res
        .status(200)
        .json({ successExist: false, message: "Coupon already exist." });
    }
    const couponCodeArray = voucher_codes.generate({
      length: 5,
      count: 1,
      charset: voucher_codes.charset("alphanumeric"),
    });
    const couponCode = couponCodeArray[0];
    const upperCaseCouponCode = couponCode.toUpperCase();

    const newCoupon = new CouponDb({
      couponName: title,
      couponCode: upperCaseCouponCode,
      discountAmount: parseFloat(discountAmount),
      minAmount: parseFloat(minimumAmount),
      couponDescription: description,
      Availability: availability,
      expiryDate: new Date(endDate),
      status: true,
      userUsed: [],
    });

    const savedCoupon = await newCoupon.save();

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


//* Load coupon list page
const loadCouponList = asyncHandler(async (req, res) => {
  try {
    const couponData = await CouponDb.find().sort({ createdAt: -1 });
    res.render("admin/couponList", { couponData });
  } catch (error) {
    console.log("loadCouponError", error);
  }
});


//* Load edit coupon page
const loadCouponEdit = asyncHandler(async (req, res) => {
  try {
    const couponId = req.query.id;
    const coupon = await CouponDb.findById(couponId);
    res.render("admin/editCoupon", { coupon });
  } catch (error) {
    console.log("LoadEditCouponError", error);
  }
});

//* Edit coupon control
const editCouponControl = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      couponID,
      endDate,
      availability,
      discountAmount,
      minimumAmount,
      description,
    } = req.body;

    const numericRegex = /^\d+$/;
    const titleRegex = /^[a-zA-Z]+(\s+[a-zA-Z]+)*$/;

    if (
      !title ||
      !endDate ||
      !availability ||
      !discountAmount ||
      !minimumAmount ||
      !description
    ) {
      return res
        .status(200)
        .json({
          successValidation: false,
          message: "All fields are required.",
        });
    }

    if (!titleRegex.test(title)) {
      return res.status(200).json({
        statusTitle: false,
        message:
          "Title must contain only letters and be at least 4 characters long.",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (new Date(endDate) < currentDate) {
      return res.status(200).json({
        successDate: false,
        message: "The expiry date must not be earlier than today.",
      });
    }

    if (!numericRegex.test(discountAmount)) {
      return res
        .status(200)
        .json({
          successDiscount: false,
          message: "Discount amount must be a number.",
        });
    }

    if (!numericRegex.test(minimumAmount)) {
      return res
        .status(200)
        .json({
          successMinAmt: false,
          message: "Minimum amount must be a number.",
        });
    } 
    //  if (minimumAmount <= discountAmount) {
    //   return res
    //     .status(200)
    //     .json({
    //       successMinAmt: false,
    //       message: "Minimum amount cannot be less than or equals the discount amount.",
    //     });
    // }

    const descriptionWords = description.split(/\s+/);
    if (descriptionWords.length < 5 || descriptionWords.length > 15) {
      return res.status(200).json({
        successDescription: false,
        message: "Description must contain between 5 and 15 words.",
      });
    }

    const existingCoupon = await CouponDb.findOne({
      couponName: title,
      _id: { $ne: couponID },
    });
    
    if (existingCoupon) {
      return res
        .status(200)
        .json({ successExist: false, message: "Coupon already exist." });
    }

    const updatedCoupon = await CouponDb.findByIdAndUpdate(couponID, {
      couponName: title,
      discountAmount: parseFloat(discountAmount),
      minAmount: parseFloat(minimumAmount),
      couponDescription: description,
      Availability: availability,
      expiryDate: new Date(endDate),
      status: true,
      userUsed: [],
    });
    res.status(201).json({
      success: true,
      message: "Coupon updated successfully.",
      data: updatedCoupon,
    });
  } catch (error) {
    console.log("editCouponError", error);
  }
});

//* Deleting the coupon from the list
const deleteCouponControl = asyncHandler(async (req, res) => {
  try {
    const { couponId } = req.body;
    console.log("id", couponId);
    const deletedcoupon = await CouponDb.findByIdAndDelete(couponId);
    console.log("deleted", deletedcoupon);
    res
      .status(200)
      .json({ success: true, message: "Coupon Deleted successfully" });
  } catch (error) {
    console.log("errorDeletingCoupon", error);
  }
});

//* Enable and disable coupon
const statusChangeOfCoupon = asyncHandler(async (req, res) => {
  console.log("asdfghjkl");
  try {
    const { couponID, status } = req.body;
    console.log(req.body, "bodydata");
    const couponId = { _id: couponID };
    const coupon = await CouponDb.findOne(couponId);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.Availability === 0) {
      return res.status(200).json({
        success: false,
        message: "Coupon is not available for status change",
      });
    }
    const update = { status: status === "active" ? true : false };

    const changedCoupon = await CouponDb.findOneAndUpdate(couponId, update, {
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

//? Exporting modules to coupon route
module.exports = {
  loadCreateCoupon,
  loadCouponList,
  addNewCoupon,
  loadCouponEdit,
  editCouponControl,
  deleteCouponControl,
  statusChangeOfCoupon,
};
