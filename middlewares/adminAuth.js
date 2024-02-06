const isLogin= async(req,res,next)=>{

    try {
        
        if (req.session.adminID) {
            next();
        }else{
            res.redirect('/admin/login');
        }

    } catch (error) {
        console.log(error.message);
    } 

}

const isLogout= async(req,res,next)=>{

    try {
        if(req.session.adminID){
            res.redirect('/admin');
         }else {
         next();
         }
    } catch (error) {
        console.log(error.message);
    }

} 

module.exports = {
    isLogin,
    isLogout
}
