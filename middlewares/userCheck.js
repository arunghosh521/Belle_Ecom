const expressAsyncHandler = require("express-async-handler");
const UserDB = require('../models/userModel');
const checkUserBlocked = expressAsyncHandler(async(req,res,next)=>{
    if (req.session.userId) {
        const email = req.session.userId;
        console.log(email);
        const userEmail = await UserDB.findOne({_id:email});
        res.locals.user = userEmail;
        console.log("locals", res.locals.user);
        
    } else {
        res.locals.user = null;
        
    }
});

module.exports = checkUserBlocked;