const mongoose = require("mongoose");
const moment = require("moment");

const articleSchema = mongoose.Schema({
    authorId: {
        type: Number,
        required: true,
        unique: 1,
    },
    title: {
        type: String,
        required: true,
    },
    nickname: {
        type: String
    },
    borderDate: {
        type: Date,
        default: moment().add('9', 'h').format("YYYY-MM-DD hh:mm:ss")
    },
    password: {
        type: String,
    }
});

module.exports = mongoose.model("Articles", articleSchema);
