const asyncHandler = require("express-async-handler");
const UserDb = require("../models/userModel");
const ProductDB = require("../models/products");
const OrderDB = require("../models/order");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  MongooseError,
} = require("../middlewares/appError");

//* Rendering the login page of admin
const loadAdminlogin = asyncHandler(async (req, res) => {
  try {
    let success = req.flash("fmessage")[0];
    res.render("admin/adminLogin", { message: success });
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//* Rendering the admin dashboard
const loadDashboard = asyncHandler(async (req, res) => {
  try {
    const productCount = await ProductDB.find().count();
    const orderCount = await OrderDB.find().count();
    const userCount = await UserDb.find().count();
    function formatUserCount(userCount) {
      if (userCount >= 1000) {
        return (userCount / 1000).toFixed(1) + "k";
      } else {
        return userCount.toString();
      }
    }
    const formattedUserCount = formatUserCount(userCount);

    const orderData = await OrderDB.find({orderStatus: 'Delivered'});

    const TotalOrderCost = orderData.reduce((total, order)=> {
      return total + order.orderTotal;
    },0)

    //* query for find best selling category
    const query = [
      {
        $group: {
          _id: "$category",
          totalSold: { $sum: "$sold" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $project: {
          _id: 0,
          categoryName: "$categoryInfo.category",
          totalSold: 1,
        },
      },
      {
        $sort: { totalSold: -1 },
      },
      {
        $limit: 5,
      },
    ];

    const bestSellingCategory = await ProductDB.aggregate(query).exec();
    const bestSellingProducts = await ProductDB.find({ sold: { $gte: 3 } })
      .sort({ sold: -1 })
      .limit(10);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    //* Aggregation for DailyWise Sales Report
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1),
          },
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
          orderTotal: { $sum: "$orderTotal" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const dailyWiseReport = await OrderDB.aggregate(pipeline).exec();

    const arrayDayWise = new Array(31).fill(0);
    dailyWiseReport.forEach((doc) => {
      arrayDayWise[doc._id - 1] = doc.orderTotal;
    });
    res.render("admin/dashboard", {
      productCount,
      orderCount,
      userCount: formattedUserCount,
      bestSellingProducts,
      arrayDayWise,
      bestSellingCategory,
      TotalOrderCost
    });
  } catch (error) {
    if(error instanceof MongooseError){
      throw new MongooseError('Database Error');
    } else {
      throw new InternalServerError('Internal server error');
    }
  }
});

//* Generating period wise report for chart
const generatePeriodWiseReport = asyncHandler(async (req, res) => {
  try {
    const period = req.query.period;
    if (period === "monthly") {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
            orderStatus: "Delivered",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
            orderTotal: { $sum: "$orderTotal" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ];

      const monthlyReport = await OrderDB.aggregate(pipeline).exec();

      const arrayMonthlyWise = new Array(12).fill(0);
      monthlyReport.forEach((doc) => {
        arrayMonthlyWise[doc._id.month - 1] = doc.orderTotal;
      });

      res.json({
        successMonthly: true,
        monthlyReport: arrayMonthlyWise,
      });
    } else if (period === "day") {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      //* Aggregation for DailyWise Sales Report
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, currentMonth, 1),
              $lt: new Date(currentYear, currentMonth + 1, 1),
            },
            orderStatus: "Delivered",
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            count: { $sum: 1 },
            orderTotal: { $sum: "$orderTotal" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];

      const dailyWiseReport = await OrderDB.aggregate(pipeline).exec();

      const arrayDayWise = new Array(31).fill(0);
      dailyWiseReport.forEach((doc) => {
        arrayDayWise[doc._id - 1] = doc.orderTotal;
      });
      res.json({
        successDay: true,
        dayReport: arrayDayWise,
      });
    } else if (period === "yearly") {
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(2020, 0, 1),
              $lt: new Date(2031, 0, 1),
            },
            orderStatus: "Delivered",
          },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            count: { $sum: 1 },
            orderTotal: { $sum: "$orderTotal" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];

      const yearlyData = await OrderDB.aggregate(pipeline).exec();

      const arrayYearlyWise = new Array(11).fill(0);
      yearlyData.forEach((doc) => {
        arrayYearlyWise[doc._id - 2020] = doc.orderTotal;
      });
      res.json({
        successYearly: true,
        yearReport: arrayYearlyWise,
      });
    } else {
      res.status(400).json({ error: "Unsupported period" });
    }
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//* Login control for admin
const AdminLoginCntrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const findAdmin = await UserDb.findOne({ email });
    if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
      if (findAdmin.is_admin === true) {
        req.session.adminID = findAdmin._id;
        return res.redirect("/admin/dashboard");
      } else {
        req.flash("fmessage", "Invalid Credentials");
        return res.redirect("/admin");
      }
    }
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//* Logout control for admin
const logout = asyncHandler(async (req, res) => {
  try {
    req.session.adminID = null;
    res.redirect("/admin");
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//* Load users for user view page
const loadUsers = asyncHandler(async (req, res) => {
  try {
    const User = await UserDb.find({ is_admin: false });
    res.render("admin/viewUser", { User });
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//* Blocking users
const toggleBlockUser = asyncHandler(async (req, res) => {
  try {
    const { userId, isBlocked } = req.body;

    const user = await UserDb.findByIdAndUpdate(
      userId,
      { is_blocked: isBlocked },
      { new: true }
    );

    res.json({ success: true });
  } catch (error) {
    throw new InternalServerError('Internal server error');
  }
});

//? Exporting modules to admin route
module.exports = {
  loadAdminlogin,
  AdminLoginCntrl,
  logout,
  loadUsers,
  toggleBlockUser,
  loadDashboard,
  generatePeriodWiseReport,
};
