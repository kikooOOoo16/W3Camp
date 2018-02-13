// all the middleware goes here
var Campground = require("../models/campground");
var Comment = require("../models/comment");

var middlewareObj = {
    checkCampgroundOwnership: function(req, res, next){
            // is user logged in
       if(req.isAuthenticated()) {
           Campground.findById(req.params.id, function(err, foundCampground){
              if (err || !foundCampground) { //null return patch !null = true
                   req.flash("error", "Campground not found.");
                   res.redirect("back");
               } else {
                   // does user own the campground foundCampground.author.id is a mongoose object
                   if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                         next();
                   } else {
                    // otherwise, redirect
                    req.flash("error", "You don't have permission to do that.");
                    res.redirect("back");
                   }
               }
           });
        } else {
            // if not, redirect
            req.flash("error", "You need to be logged in to do that.");
            res.redirect("back");
        }
    },
    
    checkCommentsOwnership: function(req, res, next) {
            // is user logged in
        if(req.isAuthenticated()) {
               Comment.findById(req.params.comment_id, function(err, foundComment){
                   if (err || !foundComment) {
                       req.flash("error", "Comment not found");
                       res.redirect("back");
                   } else {
                       // does user own the comment foundComment.author.id is a mongoose object
                       if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                             next();
                       } else {
                        // otherwise, redirect
                        req.flash("error", "You don't have permission to do that");
                        res.redirect("back");
                       }
                   }
               });
        } else {
            // if not, redirect
            req.flash("error", "You need to be logged in to do that.");
            res.redirect("/login");
        }
    },
    
    checkProfileOwnership: function (req, res, next) {
        if (req.isAuthenticated()) {
            if(req.user._id.equals(req.params.id)) {
                next();
            } else {
                req.flash("error", "Access denied, this is not your profile.");
                res.redirect("/campgrounds");
            }
        } else {
            req.flash("error", "You need to be logged in to do that.");
            res.redirect("/login");
        }
    },
    
    isLoggedIn: function(req, res, next){
        if (req.isAuthenticated()){
            return next();
        }
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
    
}

module.exports = middlewareObj;