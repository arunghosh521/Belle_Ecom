const bodyParser = require("body-parser");
const express = require("express");
const session = require('express-session');
const flash = require('express-flash');
const dbConnect = require("./config/dbConnect");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 3001;
const path = require('path');
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const {userAuthMiddleware} = require("./middlewares/userAuth");
const {adminAuthMiddleware} = require("./middlewares/adminAuth");
const checkUserBlocked = require("./middlewares/userCheck");
const authRouter = require("./routes/authRoute");
const adminRouter = require("./routes/adminRoute");
const categoryRouter = require("./routes/categoryRoute");
const productRouter = require("./routes/productRoute");



dbConnect();

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {maxAge:600000},
  resave: false,
  saveUninitialized: true,
}));

app.use(flash());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public')); 

// app.use(userAuthMiddleware);
// app.use(adminAuthMiddleware);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use((req, res, next) => {
  res.set('Cache-control', 'no-store,no-cache')
  next()
})

//categoryRoute
app.use("/admin/category", categoryRouter);

//productRoute
app.use("/admin/product", productRouter);

//adminRoute
app.use("/admin", adminRouter);

//userRoute
app.use("/", authRouter);



const errorMiddleware = (req, res, next) => {
  next(); 
};

app.use(errorMiddleware);
app.use(notFound);
app.use(errorHandler)



app.listen(PORT, () => {
  console.log(`Server is running  at PORT http://localhost:${PORT}`);
});
