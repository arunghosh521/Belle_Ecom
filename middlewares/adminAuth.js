

const checkCondition = async (req, res, next, checkType) => {
    try {
        if (checkType === 'login') {
            if (!req.session.adminID) {
                res.redirect('/admin');
            } else {
                next();
            }
        } else if (checkType === 'logout') {
            if (req.session.adminID) {
                res.redirect('/admin/dashboard');
            } else {
                next();
            }
        } else {
            throw new Error('Invalid check type');
        }
    } catch (error) {
        console.log(error.message);
    }
};


const isLogin = async (req, res, next) => {
    await checkCondition(req, res, next, 'login');
};

const isLogout = async (req, res, next) => {
    await checkCondition(req, res, next, 'logout');
};

module.exports = {
    isLogin,
    isLogout,
    checkCondition
};



