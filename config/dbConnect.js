const mongoose = require("mongoose");
const dotenv = require("dotenv");

const dbConnect = async () => {
  try {
    dotenv.config();
    //? Set strictQuery to false to address the deprecation warning
    mongoose.set("strictQuery", false);

    //* Connect to the MongoDB database
    await mongoose
      .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Database Connected Successfully");
      });
  } catch (error) {
    console.log("Database error");
    throw error;
  }
};
module.exports = dbConnect;
