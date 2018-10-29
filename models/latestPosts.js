var mongoose = require("mongoose");

var latestPostsSchema = new mongoose.Schema ({
    posts: [
        {
            postTopicId: String,
            postTopic: String,
            text: String,
            createdAt: {type: Date, default: Date.now()},
            author: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                username: String
            }
        }
    ]
}, {
  usePushEach: true //fixes push all mongo error support
});

module.exports = mongoose.model("latestPosts", latestPostsSchema);