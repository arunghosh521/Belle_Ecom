const asyncHandler = require("express-async-handler");

const adminAuthMiddleware = asyncHandler(async(req,res,next)=>{
    try {
        if(req.session.adminID){
            res.locals.admin = req.session.adminID;
            console.log("adminGettinCheckingMiddleware", res.locals.admin);
        }else{
            res.locals.admin = null;
            
        }
        next();
    } catch (error) {
        next(error);
        console.log('userAuthMiddlewareError', error);
    }
});

module.exports = {adminAuthMiddleware};