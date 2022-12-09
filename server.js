if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");

const userRouter = require("./routes/user");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", () => console.error("error"));
db.once("open", () => console.log("Connected to Mongoose"));

app.use("/", userRouter);

app.listen(process.env.PORT || 3000);


module.exports = {
  entry: "./index.js",
  stats: { warnings: false }
};