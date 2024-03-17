const { default: mongoose } = require("mongoose");

const dbConnect = async () => {
  try {
    return mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      mongoose.set('strictQuery', false);
      console.log("Database Connected Successfully");
    })
  
  } catch (error) {
    console.log("Database error");
    throw error
  }
};
module.exports = dbConnect;

