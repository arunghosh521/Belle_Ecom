const bodyParser = require("body-parser");
const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const dbConnect = require("./config/dbConnect");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 3001;
const path = require("path"); 
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const nocache = require("nocache");
const authRouter = require("./routes/authRoute");
const adminRouter = require("./routes/adminRoute");
const categoryRouter = require("./routes/categoryRoute");
const productRouter = require("./routes/productRoute");
const cartRouter = require("./routes/cartRoute");
const addressRouter = require("./routes/addressRoute");
const userOrderRoute = require("./routes/userOrderRoute");
const orderRouter = require("./routes/orderRoute");
const wishRouter = require("./routes/wishlistRoute");
const couponRouter = require("./routes/couponRoute");
const salesRouter = require("./routes/salesRoute");
const offerRouter = require("./routes/offerRoute");
const walletRouter = require("./routes/walletRoute");

dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running  at PORT http://localhost:${PORT}`);
  });
}).catch(error => {
  console.log("Failed to connect to the database", error);
})

const TwoDaysValidity = 2 * 24 * 60 * 60 * 1000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: TwoDaysValidity,
    }
  })
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
});
app.use(cookieParser());
app.use(nocache());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//* categoryRoute
app.use("/admin/category", categoryRouter);

//* productRoute
app.use("/admin/product", productRouter);

//* salesRoute
app.use("/admin/salesReport", salesRouter);

//* orderRoute
app.use("/admin/orderList", orderRouter);

//* offerRoute
app.use("/admin/", offerRouter);

//* couponRoute
app.use("/admin", couponRouter);

//* adminRoute
app.use("/admin", adminRouter);

//* addressRoute
app.use("/address", addressRouter);

//* walletRoute
app.use("/userProfile", walletRouter);

//* wishlistRoute
app.use("/wishlist", wishRouter);

//* cartRoute
app.use("/cart", cartRouter);

//* userOrderroute
app.use("/orderPlaced", userOrderRoute);

//* userRoute
app.use("/", authRouter);

const errorMiddleware = (req, res, next) => {
  next();
};

app.use(errorMiddleware);
app.use(notFound);
app.use(errorHandler);


