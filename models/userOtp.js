const mongoose = require("mongoose");

var userOtpSchema = new mongoose.Schema(
    {
        email:{
            type: String,
            required: true,
        },
        otp:{
            type:String,
            required:true,
        },
        createdAt:{
            type:Date,
            default:Date.now,
            expires:60,
        }
    });

    const OTP = mongoose.model('OTP',userOtpSchema);

    module.exports = {OTP};