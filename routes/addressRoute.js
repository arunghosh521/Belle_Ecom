const express = require('express');
const addressRoute = express.Router();
const addressController = require('../controller/addressController');

addressRoute.post('/',addressController.addAddressControl);
addressRoute.delete('/delete',addressController.deleteAddressControl);
addressRoute.post('/details',addressController.detailsOfAddress);
addressRoute.put('/editAddress',addressController.editAddressControl);


module.exports = addressRoute;


