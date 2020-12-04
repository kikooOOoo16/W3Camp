var express         = require("express"),
    router          = express.Router(),
    User            = require("../models/user"),
    Campground      = require("../models/campground"),
    ForumPost       = require("../models/forumPost"),
    middleware      = require("../middleware/index.js"),
    passport        = require("passport"),
    async           = require("async"),
    nodemailer      = require("nodemailer"),
    crypto          = require("crypto"),
    request         = require("request"),
    multer          = require("multer"),
    cloudinary      = require("cloudinary");
    
// MULTER config
var storage = multer.diskStorage({
    filename: function(req, file, callback){
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function(req, file, cb){
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter}); 

// CLOUDINARY config
cloudinary.config({
    cloud_name: "wecampapp",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
    
// ROOT ROUTE
router.get("/", function(req, res) {
    res.render("landing");
});

// =================
// AUTH ROUTES 

// SHOW REGISTRATION FORM
router.get("/register", function(req, res) {
    if (req.isAuthenticated()){
        req.flash("error", "You need to logout to register!");
        return res.redirect("/campgrounds");
    }
    res.render("register", {page: "register", siteKey: process.env.RE_CAPTCHA_SITE_KEY});
});

// HANDLE REGISTRATION LOGIC
router.post("/register", function(req, res) {
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
        req.flash("error", "Please select captcha");
        return res.redirect("/register");
    }
    // secret key
    var secretKey = process.env.RE_CAPTCHA_SECRET_KEY;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;
    request.get(verifyURL, (err, response, body) => {
        // if not successful
        if (body.success !== undefined && !body.success) {
            req.flash("error", "Captcha Failed");
            return res.redirect("/register");
        }
        req.body.user.avatarImg = {
            url : "/images/defaultAvatarGrey_2.png"
        }; 
        req.body.user.coverImg = {
            url : "/images/backgrounds/user-default-cover.jpg"
        }; 
        if (req.body.adminPass === process.env.ADMIN_PASS){
            req.body.user.isAdmin = true;
        }
        User.register(req.body.user, req.body.password, function(err, user) {
            if (err) {
                // console.log(err.message);
                req.flash("error", err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local", {successRedirect: "/campgrounds", failureRedirect: "/login"})(req, res, function() {
                req.flash("success", "Welcome to W3Camp " + user.username);
                res.redirect("/campgrounds");
            });
        });
    });
});

// SHOW LOGIN FORM
router.get("/login", function(req, res) {
    if (req.isAuthenticated()) {
        req.flash("error", "You are already logged in!");
        return res.redirect("/campgrounds");
    }
    res.render("login", {page: "login"});
});

// HANDLE LOGIN LOGIC
router.post("/login", function(req, res, next) {
    passport.authenticate("local", function(err, user, info) { 
        if (err) {
            console.log(err);
            return next(err);
        }
        if (!user) {
            if (info) {
                req.flash("error", info.message);
            }
            return res.redirect("/login");
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            req.flash("success", "Successfully logged in!");
            var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campgrounds';
            delete req.session.redirectTo;
            res.redirect(redirectTo);
        });
    })(req, res, next);
});

// LOGOUT LOGIC
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

// SHOW USER PROFILE ROUTE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        var currentPage = "";
        if (err) {
            req.flash("error", "User not found!");
            return res.redirect("back");
        }
        if (req.user && foundUser.id === req.user.id) {
            currentPage = "userPage";
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function (err, usersCampgrounds) {
            if (err) {
                req.flash("error", "User not found!");
                return res.redirect("back");
            }
            ForumPost.find({'author.id' : foundUser._id}, function (err, foundUserPosts) {
                if (err) {
                    req.flash("error", "User not found!");
                    return res.redirect("back");
                } 
                res.render("users/show", {user: foundUser, campgrounds: usersCampgrounds, page: currentPage, userPosts: foundUserPosts});
            });
        });
    });  
});

// EDIT USER PROFILE ROUTE
router.get("/users/:id/edit", middleware.checkProfileOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if (err) {
            req.flash("error", "User not found!");
            res.redirect("back");
        }
        res.render("users/edit", {user: foundUser}); 
    });
});

// UPDATE USER PROFILE ROUTE 
router.put("/users/:id", middleware.checkProfileOwnership, upload.single("image"), function (req, res) {
    if (req.file) {
        // check if updating cover image
        if (req.body.coverImageBool !== undefined && req.body.coverImageBool === "true") {
            if (req.body.oldCoverImagePublicId) { 
                // delete old cover image
                cloudinary.uploader.destroy(req.body.oldCoverImagePublicId, function(error, result) {
                    if (error && !error.result === "ok") {
                        console.log("Cloudinary cover image delete error : " + error);
                        req.flash("error", "There was a problem deleting your old cover image.");
                        res.redirect("/users/" + req.params.id);
                    }
                });
            } 
            // upload new cover image
            cloudinary.uploader.upload(req.file.path, function(result){
                var newCoverImg = {
                    publicId: result.public_id,
                    url: result.secure_url
                }
                User.findByIdAndUpdate(req.params.id, {$set: {coverImg : newCoverImg}}, function (err, user){
                    if (err || !user) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        req.flash("success", "Cover image updated.");
                        return res.redirect("/users/" + req.params.id);   
                    }
                });
            });
        } else if(req.body.userImageBool !== undefined) {
            // update avatar image
            // delete old avatar image
            cloudinary.uploader.destroy(req.body.oldAvatarImagePublicId, function(result) {
                if (result.result !== 'ok' && result.result !== undefined) {
                    req.flash("error", "There was an error while deleting your old avatar image.");
                    return res.redirect("/users/" + req.params.id);
                }
                // upload new avatar image
                cloudinary.uploader.upload(req.file.path, function(result){
                    var newAvatarImg = {
                        publicId: result.public_id,
                        url: result.secure_url
                    }
                    User.findByIdAndUpdate(req.params.id, {$set: {avatarImg : newAvatarImg}}, function (err, user){
                        if (err || !user) {
                            req.flash("error", "There was an error while updating your new avatar image in the DB.");
                            return res.redirect("/users/" + req.params.id);
                        }
                        ForumPost.update({'author.id' : user._id}, { $set: {'author.avatarImgUrl': result.secure_url} }, {multi: true }, function (err, updatePostsRes) {
                            if (err) {
                                req.flash("error", "There was an error while applying your new avatar image to your forum posts.");
                                return res.redirect("/users/" + req.params.id);
                            }
                            req.flash("success", "Profile picture successfully updated!");
                            return res.redirect("/users/" + req.params.id);  
                        });
                    });
                });
            });
        }
    } else {
        if (req.body.adminPass === process.env.ADMIN_PASS){
            req.body.user.isAdmin = true;
        }
        User.findByIdAndUpdate(req.params.id, {$set: req.body.user}, function (err, user){
            if (err || !user) {
                req.flash("error", "Please select a new image.");
                return res.redirect("back");
            } else {
                req.flash("success", "Profile info successfully updated!");
                req.flash("warning", "If you change your username you are automatically logged out!");
                return res.redirect("/users/" + user.id);   
            }
        });
    }
});

// FORGOT PASSWORD ROUTES
router.get("/forgot", function(req, res) {
    res.render("users/forgot");
});

router.post("/forgot", function (req, res, next) {
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email: req.body.email}, function(err, foundUser){
                if (!foundUser || err) {
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                foundUser.resetPasswordToken = token;
                foundUser.resetPasswordExpires = Date.now() + 3600000; //1 hour
                foundUser.save(function (err) {
                    done(err, token, foundUser);
                });
            });
        },
        function (token, foundUser, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_ACCOUNT,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            var mailOptions = {
                from: "w3CampApp@gmail.com",
                to: foundUser.email,
                subject: "Node.js Password Reset",
                text: "You are receiving this because you (or someone else) have requested the reset of the password for your account. \n \n " +
                    "Please click on the following link, or paste it into your browser to complete the proccess: \n \n" +
                    "http://" + req.headers.host + "/reset/" + token + "\n \n" +
                    "If you didn't request this, please ignore this email and your password will remain unchanged. \n"
            }
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash("error", "There was a problem sending your request.");
                    return res.redirect("/forgot");
                } 
                console.log("The user " + foundUser.username + " forgot his password. Sending reset mail.");
                req.flash("success", "An e-mail has been sent to " + foundUser.email + " with further instructions.");
                done (err, done);
            });
        }, 
    ], function (err) {
        if (err) {
            req.flash("error", "Something went wrong.");
            console.log("Forgot password error : " + err);
            return next(err);
        }
        res.redirect("/forgot");
    });
});

// RESET PASSWORD ROUTES
router.get("/reset/:token", function(req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, foundUser) {
        if (!foundUser || err) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("users/reset", {token: req.params.token});
    });
});

router.post("/reset/:token", function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, foundUser) {
                if (!foundUser || err) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("/forgot");
                }
                if (req.body.password === req.body.confirm) {
                    foundUser.setPassword(req.body.password, function(err) {
                        if (err) {
                            req.flash("error", "Something went wrong while changing your password.");
                            return res.redirect("/forgot");
                        }
                        foundUser.resetPasswordToken = undefined;
                        foundUser.resetPasswordExpires = undefined;
                        foundUser.save(function (err) {
                            if (err) {
                                req.flash("error", "Something went wrong.");
                                return res.redirect("/forgot");
                            }
                            req.logIn(foundUser, function (err)  {
                                done(err, foundUser);
                            });
                        });
                    });
                } else {
                    req.flash("error", "The passwords do not match.");
                    return res.redirect("/reset/" + req.params.token);
                }
            });
        },
        function(foundUser, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_ACCOUNT,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            var mailOptions = {
                to: foundUser.email,
                from: "w3CampApp@gmail.com",
                subject: "Your password on W3Camp has been changed",
                text: "Hello \n \n" +
                    "This is a confirmation that the password for your account " + foundUser.username + " registered under the name " + foundUser.firstName + " " + foundUser.lastName+ " has just been changed. \n"
            }
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash("error", "There was a problem sending your request.");
                    return res.redirect("/forgot");
                }
                console.log("The user "+ foundUser.username + " just reset his password.");
                req.flash("success", "Success! Your password has been changed.");
                done (err, done);
            });
        },
    ], function (err) {
        if (err) {
            req.flash("error", "Something went wrong.");
            return res.redirect("/forgot");
        }
        res.redirect("/campgrounds");
    });
});

module.exports = router;
