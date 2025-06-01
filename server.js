const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const loggerMiddleware = require("./src/middleware/loggerMiddleware");
const router = require("./src/routes/routes");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));

const app = express();
const port = 8000;

// Setting up middlewares
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api", router);
app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});
