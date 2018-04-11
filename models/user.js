var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    passsword: String,
    firstName: String,
    lastName: String,
    bio: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatarImg: {
        url: String,
        publicId: String
        },
    coverImg: {
        url: String,
        publicId: String
        },
    isAdmin: {type: "Boolean", default: false},
    postsCount: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now()}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);