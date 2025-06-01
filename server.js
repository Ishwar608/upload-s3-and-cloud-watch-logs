const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const loggerMiddleware = require("./src/middleware/loggerMiddleware");
const userData = require("./src/routes/userData");
const resumeRoutes = require("./src/routes/resumeRoutes");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));

const app = express();
const port = 8000;

// Setting up middlewares
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api/users", userData);
app.use("/api/resume", resumeRoutes);

app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});
