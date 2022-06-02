const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = mongoose.Schema({
    nickname: {
        type: String,
        unique: 1
    },
    borderDate: {
        type: Date,
        default: moment().add('9', 'h').format("YYYY-MM-DD hh:mm:ss")
    },
    comment: {
        type: String,
        require: true,
    },
    commentId: {
        type: Number,
        require: true,
        unique: 1,
    }
});


module.exports = mongoose.model("comments", userSchema);
