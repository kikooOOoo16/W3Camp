var mongoose = require("mongoose");

var forumPostSchema = new mongoose.Schema({
    forumTopic: String,
    text: String,
    createdAt: {type: Date, default: Date.now()},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatarImgUrl: String,
        isAdmin: {type: "Boolean", default: false},
        postsCount: Number,
        createdAt: Date
    },
});

module.exports = mongoose.model("ForumPost", forumPostSchema);