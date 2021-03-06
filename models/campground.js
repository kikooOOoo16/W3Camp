var mongoose = require("mongoose");

// SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
    name: String,
    image: {
        url: String,
        publicId: String
    },
    description: String,
    price: String,
    location: String,
    lat: Number,
    lng: Number,
    contact: {
        phone : String,
        email : String,
        website : String
    },
    createdAt: {type: Date, default: Date.now()}, 
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
}, {
  usePushEach: true //fixes push all mongo error support
});

module.exports = mongoose.model("Campground", campgroundSchema);