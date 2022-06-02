const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  nickname: {
    type: String,
    unique: 1
  },
  password: String,
  confirmPassword: String,
});
UserSchema.virtual("userId").get(function () {
  return this._id.toHexString();
});
UserSchema.set("toJSON", {
  virtuals: true,
});
module.exports = mongoose.model("User", UserSchema);

// const mongoose = require("mongoose");

// const UserSchema = mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   nickname: {
//     type: String,
//     required: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   confirmpassword: {
//     type: String,
//     required: true,
//   },
  

// });
// UserSchema.virtual("userId").get(function () {
//   return this._id.toHexString();
// });
// UserSchema.set("toJSON", {
//   virtuals: true,
// });
// module.exports = mongoose.model("User", UserSchema);