var express         = require("express"),
    router          = express.Router(),
    User            = require("../models/user"),
    Campground      = require("../models/campground"),
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
      console.log(req.body);
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
            url : "/images/defaultAvatar.png"
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
                req.flash("success", "Welcome to YelpCamp " + user.username);
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
            return next(err);
        }
        if (!user) {
            return res.redirect("/login");
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
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

// USER PROFILE ROUTE
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function (err, foundUser) {
       var currentPage = "";
       if (err) {
           req.flash("error", "User not found!");
           res.redirect("back");
       } else {
            if (req.user && foundUser.id === req.user.id) {
                currentPage = "userPage";
            }
            Campground.find().where("author.id").equals(foundUser._id).exec(function (err, usersCampgrounds) {
               if (err) {
                   req.flash("error", "User not found!");
                   res.redirect("back");
               } else {
                //   eval(require('locus'));
                   res.render("users/show", {user: foundUser, campgrounds: usersCampgrounds, page: currentPage});                  
               }
            });
       }
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
    // eval(require('locus'));
    if (req.file) {
        // delete old avatar image
        cloudinary.uploader.destroy(req.body.oldAvatarImagePublicId, function(error, result) {
            if (error) {
                console.log(error);
            }
            console.log(result); 
        });
        // upload new avatar image
        cloudinary.uploader.upload(req.file.path, function(result){
            req.body.user.avatarImg = {
                publicId: result.public_id,
                url: result.secure_url
            }
            User.findByIdAndUpdate(req.params.id, {$set: req.body.user}, function (err, user){
               if (err || !user) {
                    req.flash("error", err.message);
                    res.redirect("back");
               } else {
                    req.flash("success", "Profile info successfully updated!");
                    res.redirect("/users/" + user.id);   
               }
            });
        });
    } else {
        User.findByIdAndUpdate(req.params.id, {$set: req.body.user}, function (err, user){
           if (err || !user) {
                req.flash("error", err.message);
                res.redirect("back");
           } else {
                req.flash("success", "Profile info successfully updated!");
                res.redirect("/users/" + user.id);   
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
                service: "Gmail",
                auth: {
                    user: process.env.GMAIL_ACCOUNT,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            var mailOptions = {
                to: foundUser.email,
                from: "w3CampApp@gmail.com",
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
                console.log("mail sent");
                req.flash("success", "An e-mail has been sent to " + foundUser.email + " with further instructions.");
                done (err, done);
            });
        }, 
    ], function (err) {
        if (err) return next(err);
        res.redirect("/forgot");
    });
});

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
                        req.flash("error", "Something went wrong.");
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
                return res.redirect("/forgot");
            }
        });
    },
    function(foundUser, done) {
        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.GMAIL_ACCOUNT,
                pass: process.env.GMAIL_PASSWORD
            }
        });
        var mailOptions = {
            to: foundUser.email,
            from: "w3CampApp@gmail.com",
            subject: "Your password has been changed",
            text: "Hello \n \n" + 
            "This is a confirmation that the password for your account " + foundUser.username + " with the email: " + foundUser.email + " has just been changed. \n"
        }
        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                req.flash("error", "There was a problem sending your request.");
                return res.redirect("/forgot");
            } 
            console.log("mail sent");
            req.flash("success", "Success! Your password has been changed.");
            done (err, done);
        });
    }
    ], function (err) {
        if (err) {
            req.flash("error", "Something went wrong.");
            return res.redirect("/forgot");
        }
        res.redirect("/campgrounds");
    });
});

module.exports = router;