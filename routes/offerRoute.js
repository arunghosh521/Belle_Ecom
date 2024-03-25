const express = require("express");
const offerRoute = express.Router();
const offerController = require("../controller/offerController");
const { isLogin, isLogout } = require("../middlewares/adminAuth");

offerRoute
  .route("/createOffer")
  .get(isLogin, offerController.loadCreateOffer)
  .post(offerController.createOfferControl);
offerRoute.get("/offerList", isLogin, offerController.loadOfferList);
offerRoute.delete("/deleteOffer", offerController.deleteOfferControl);
offerRoute.post("/statusChange", offerController.statusChangeOfOffer);
offerRoute
  .route("/editOffer")
  .get(isLogin, offerController.loadEditOffer)
  .patch(offerController.editOfferControl);
  offerRoute.post("/offerListing", offerController.offerDetailsControl);
  offerRoute.post("/applyOfferToProduct", offerController.offerApplyingToProduct);
  offerRoute.post("/removeOfferProduct", offerController.offerRemovingProduct);
  offerRoute.post("/applyOfferToCategory", offerController.offerApplyingToCategory);
  offerRoute.post("/removeOfferCategory", offerController.offerRemovingCategory);

module.exports = offerRoute;
