var mongoose = require("mongoose");

var forumTopicSchema = new mongoose.Schema ({
    topic: String,
    name: String,
    description: String,
    createdAt: {type: Date, default: Date.now()}, 
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
    },
    posts : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ForumPost"
        }
    ]
}, {
  usePushEach: true //fixes push all mongo error support
});

module.exports = mongoose.model("forumTopic", forumTopicSchema);