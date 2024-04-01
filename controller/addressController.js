const asyncHandler = require("express-async-handler");
const AddressDB = require("../models/address");

//* Add Address to database
const addAddressControl = asyncHandler(async (req, res) => {
  try {
    const {
      firstname,
      telephone,
      address_1,
      address_2,
      city,
      postcode,
      userID,
      country_id,
      zone_id,
    } = req.body;

    if (
      !firstname ||
      !telephone ||
      !address_1 ||
      !address_2 ||
      !city ||
      !postcode ||
      !userID
    ) {
      return res
        .status(200)
        .json({ successFailed: false, message: "All fields required" });
    }

    //* Validate firstname
    if (firstname && (firstname.trim() === "" || firstname.length < 3)) {
      return res.status(200).json({
        successFirstname: false,
        message:
          "Firstname cannot be empty and must contain 3 or more letters.",
      });
    } else if (firstname && /[0-9]/.test(firstname)) {
      return res.status(200).json({
        successFirstname: false,
        message: "Firstname cannot contain numbers.",
      });
    }

    if (telephone && telephone.trim() === "") {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number cannot be empty.",
      });
    } else if (telephone && !/^\d{10}$/.test(telephone)) {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number must contain exactly 10 digits.",
      });
    } else if (telephone === "0000000000") {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number cannot be all zeros.",
      });
    }

    //* Validate address_1
    if (address_1 && address_1.trim() === "") {
      return res.status(200).json({
        successAddress1: false,
        message: "Address cannot be empty.",
      });
    }

    //* Validate address_2
    if (address_2 && address_2.trim() === "") {
      return res.status(200).json({
        successAddress2: false,
        message: "Aparment cannot be empty.",
      });
    }

    //* Validate city
    if (city && city.trim() === "") {
      return res.status(200).json({
        successCity: false,
        message: "City cannot be empty.",
      });
    }

    //* Validate postcode
    if (postcode && postcode.trim() === "") {
      return res.status(200).json({
        successPostcode: false,
        message: "Postcode cannot be empty.",
      });
    } else if (postcode && !/^\d{6}$/.test(postcode)) {
      return res.status(200).json({
        successPostcode: false,
        message: "Postcode must contain exactly 6 digits.",
      });
    }

    if (!country_id) {
      return res.status(200).json({
        successCountry: false,
        message: "Select country.",
      });
    }
    if (!zone_id) {
      return res.status(200).json({
        successState: false,
        message: "Select state.",
      });
    }

    const newAddress = new AddressDB({
      Fname: firstname,
      user: userID,
      mobile: telephone,
      address: address_1,
      apartment: address_2,
      city: city,
      pincode: postcode,
      country: country_id,
      state: zone_id,
      default: false,
    });

    const insertedAddress = await newAddress.save();
    console.log("addedAddress", insertedAddress);
    res
      .status(200)
      .json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log("addAddressError", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//* Delete Address
const deleteAddressControl = asyncHandler(async (req, res) => {
  try {
    const _id = req.query.id;

    await AddressDB.findByIdAndDelete(_id);
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.log("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

//* send address details to edit address modal
const detailsOfAddress = asyncHandler(async (req, res) => {
  try {
    const addressID = req.body.id;

    const address = await AddressDB.findById(addressID);
    res.status(200).json({ address });
  } catch (error) {
    console.log("ErrorViewingAddress", error);
  }
});

//* Edit Address
const editAddressControl = asyncHandler(async (req, res) => {
  try {
    const {
      firstname,
      telephone,
      address_1,
      address_2,
      city,
      postcode,
      addressId,
      userID,
      country_id,
      zone_id,
    } = req.body;

    console.log("zxcvbnm", country_id, zone_id);

    if (
      !firstname ||
      !telephone ||
      !address_1 ||
      !address_2 ||
      !city ||
      !postcode ||
      !userID
    ) {
      return res
        .status(200)
        .json({ successFailed: false, message: "All fields required" });
    }

    //* Validate firstname
    if (firstname && (firstname.trim() === "" || firstname.length < 3)) {
      return res.status(200).json({
        successFirstname: false,
        message:
          "Firstname cannot be empty and must contain 3 or more letters.",
      });
    } else if (firstname && /[0-9]/.test(firstname)) {
      return res.status(200).json({
        successFirstname: false,
        message: "Firstname cannot contain numbers.",
      });
    }

    if (telephone && telephone.trim() === "") {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number cannot be empty.",
      });
    } else if (telephone && !/^\d{10}$/.test(telephone)) {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number must contain exactly 10 digits.",
      });
    } else if (telephone === "0000000000") {
      return res.status(200).json({
        successMobile: false,
        message: "Mobile number cannot be all zeros.",
      });
    }

    //* Validate address_1
    if (address_1 && address_1.trim() === "") {
      return res.status(200).json({
        successAddress1: false,
        message: "Address cannot be empty.",
      });
    }

    //* Validate address_2
    if (address_2 && address_2.trim() === "") {
      return res.status(200).json({
        successAddress2: false,
        message: "Aparment cannot be empty.",
      });
    }

    //* Validate city
    if (city && city.trim() === "") {
      return res.status(200).json({
        successCity: false,
        message: "City cannot be empty.",
      });
    }

    //* Validate postcode
    if (postcode && postcode.trim() === "") {
      return res.status(200).json({
        successPostcode: false,
        message: "Postcode cannot be empty.",
      });
    } else if (postcode && !/^\d{6}$/.test(postcode)) {
      return res.status(200).json({
        successPostcode: false,
        message: "Postcode must contain exactly 6 digits.",
      });
    }

    if (!country_id) {
      return res.status(200).json({
        successCountry: false,
        message: "Select country.",
      });
    }
    if (!zone_id) {
      return res.status(200).json({
        successState: false,
        message: "Select state.",
      });
    }

    const updates = {
      Fname: firstname,
      user: userID,
      mobile: telephone,
      address: address_1,
      apartment: address_2,
      city: city,
      pincode: postcode,
      country: country_id,
      state: zone_id,
      default: false,
    };

    const updatedAddress = await AddressDB.findByIdAndUpdate(
      addressId,
      updates,
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.log("editAddressError", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});



module.exports = {
  addAddressControl,
  deleteAddressControl,
  editAddressControl,
  detailsOfAddress,
};
