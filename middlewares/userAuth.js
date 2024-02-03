const asyncHandler = require("express-async-handler");

const userAuthMiddleware = asyncHandler(async(req,res,next)=>{
    try {
        if(req.session.userId){
            res.locals.user = req.session.userId; 
            console.log('locals userMiddleware',res.locals.user);  
        }else{
            res.locals.user = null;    
        }
        next();
    } catch (error) {
        next(error);
        console.log('userAuthMiddlewareError', error);
    }
})

module.exports = {userAuthMiddleware};