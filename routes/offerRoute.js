const express = require("express");
const offerRoute = express.Router();
const offerController = require("../controller/offerController");
const { isLogin, isLogout, isBlocked } = require("../middlewares/userAuth");

offerRoute
  .route("/createOffer")
  .get(offerController.loadCreateOffer)
  .post(offerController.createOfferControl);
offerRoute.get("/offerList", offerController.loadOfferList);
offerRoute.delete("/deleteOffer", offerController.deleteOfferControl);
offerRoute.post("/statusChange", offerController.statusChangeOfOffer);
offerRoute
  .route("/editOffer")
  .get(offerController.loadEditOffer)
  .patch(offerController.editOfferControl);
  offerRoute.post("/offerListing", offerController.offerDetailsControl);
  offerRoute.post("/applyOfferToProduct", offerController.offerApplyingToProduct);
  offerRoute.post("/removeOfferProduct", offerController.offerRemovingProduct);
  offerRoute.post("/applyOfferToCategory", offerController.offerApplyingToCategory);
  offerRoute.post("/removeOfferCategory", offerController.offerRemovingCategory);

module.exports = offerRoute;
