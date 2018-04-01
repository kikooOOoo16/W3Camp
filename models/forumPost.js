var mongoose = require("mongoose");

var forumPostSchema = new mongoose.Schema({
    text: String,
    createdAt: {type: Date, default: Date.now()},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatarImgUrl: String,
        isAdmin: {type: "Boolean", default: false}
    },
});

module.exports = mongoose.model("ForumPost", forumPostSchema);