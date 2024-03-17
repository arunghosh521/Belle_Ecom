const asyncHandler = require("express-async-handler");
const AddressDB = require("../models/address");

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

    if(!firstname || !telephone || !address_1 || !address_2 || !city || !postcode || !userID || !country_id || !zone_id) {
      return res.status(200).json({ success: false, message: "All fields required" });
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
    res.status(200).json({success: true, message: "Address added successfully" });
  } catch (error) {
    console.log("addAddressError", error);
    res.status(500).json({ error: "Failed to add address" });
  }
});

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

const detailsOfAddress = asyncHandler(async (req, res) => {
  try {
    const addressID = req.body.id;

    const address = await AddressDB.findById(addressID);
    res.status(200).json({ address });
  } catch (error) {
    console.log("ErrorViewingAddress", error);
  }
});

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
    res
      .status(200)
      .json({
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
