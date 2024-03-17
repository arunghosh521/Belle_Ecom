const mongoose = require("mongoose");

var categorySchema = new mongoose.Schema(
    {
        category:{
            type: String,
            required: true,
        },
        description:{
            type: String,
            required: true,
        },
        offer:[{
            type: mongoose.Schema.ObjectId,
            ref: 'offer'
        }],
        offerApplied: {
            type: Boolean,
            default: false,
        },
        is_listed:{
            type: Boolean,
            default: true,
        },
        is_deleted:{ 
            type: Boolean,
            default:false,
        },
       
    });

const Category = mongoose.model('category', categorySchema);

module.exports = Category;