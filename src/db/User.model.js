const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  acceptTerms: {
    type: Boolean,
  },
  created: {
    type: Date,
  },
  role: {
    type: String,
  },
  verificationToken: { type: String },
  passwordHash: {
    type: String,
  },
});

module.exports = mongoose.model("accounts", userSchema);
