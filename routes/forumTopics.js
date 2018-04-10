var express         = require("express"),
    router          = express.Router(),
    middleware      = require("../middleware/index.js"),
    ForumTopic      = require("../models/forumTopic"),
    ForumPost       = require("../models/forumPost"),
    User            = require("../models/user"),
    LatestPosts     = require("../models/latestPosts"),
    moment          = require("moment");
    
    
// INDEX - show all forum topics
router.get("/", function (req,res) {
    ForumTopic.find({}, function(err, foundForumTopic) {
        if (err) {
            req.flash("error", "Something went wrong when fetching the forum topics.");
            console.log("foundForums " + foundForumTopic);
            return res.redirect("/campgrounds");
        }
        LatestPosts.findById('5ac5fbdea52ff006dcae2c78', function(err, latestPostsArray) {
            if (err) {
                req.flash("error", "There was an error with the latest posts functionality.");
                return res.redirect("/campgrounds");
            }
            res.render("forumTopics/index", {page: "forumTopics", forumTopic: foundForumTopic, latestPosts: latestPostsArray});
        });
    });
});

// NEW - show form to create new forum topic
router.get("/new", middleware.isLoggedIn, function (req,res) {
    res.render("forumTopics/new",  {page: "newForumTopic"});
});

// CREATE - add new forum topic to database
router.post("/", middleware.isLoggedIn, function (req,res) {
    // add topic author info
    req.body.forumTopic.author = {
            id: req.user._id,
            username: req.user.username
    }
    ForumTopic.create(req.body.forumTopic, function (err, newForumTopic) {
        if (err) {
            req.flash("error", "There was a problem while creating your discussion topic.");
            return res.redirect("/forumTopic");
        }
        req.flash("success", "New forum topic successfully created.")
        res.redirect("/forumTopics");
    });
});

// SHOW - Shows the discussion info about a particular forum topic 
router.get("/:id", function(req, res) {
    ForumTopic.findById(req.params.id).populate("posts").exec(function(err, foundForumTopic) {
        if (err || !foundForumTopic) {
            req.flash("error", "There was an error while loading your selected topic.");
            return res.redirect("/forumTopics");
        }
        User.findById(foundForumTopic.author.id, function(err, foundUserAuthor){
            if (err) {
                req.flash("error", "There was an error while loading your selected topic.");
                return res.redirect("/forumTopics");
            }
            res.render("forumTopics/show", {forumTopic: foundForumTopic, forumTopicAuthor: foundUserAuthor});
        });
    });
});

// EDIT - Show form for editing an existing forum topic discussion
router.get("/:id/edit", middleware.checkForumTopicOwnership, function(req, res) {
    ForumTopic.findById(req.params.id, function(err, foundForumTopic) {
        if (err) {
            req.flash("error", "There was an error loading the edit form for your topic.")
        }
        res.render("forumTopics/edit", {forumTopic: foundForumTopic, page: "editForumTopic"});
    });
});

// UPDATE - handle update request from the edit form for the forum topic
router.put("/:id", function (req, res) {
    ForumTopic.findByIdAndUpdate(req.params.id, {$set: req.body.forumTopic}, function (err, updatedForumTopic) {
       if (err) {
           req.flash("error", "There was an error handling your update requst.");
           return res.redirect("/forumTopics/" + req.params.id);
       } 
        // If successfull   
       req.flash("success", "Forum topic successfully updated.");
       res.redirect("/forumTopics/" + req.params.id);
    });
});
module.exports = router;

// DESTROY - delete forum topic
router.delete("/:id", middleware.checkForumTopicOwnership, function(req, res){
    ForumTopic.findByIdAndRemove(req.params.id, function(err, forumTopicToDelete){
       if (err) {
           req.flash("error", "There was an error delete your discussion topic.");
           return res.redirect("/forumTopcis/" + req.params.id);
       } 
       ForumPost.remove({forumTopic: forumTopicToDelete.topic}, function (err) {
           if (err) {
               req.flash("error", "There was an error while deleting the posts related to this topic.");
               return res.redirect("/forumTopcis/" + req.params.id);
           }
           //   Character.remove({ name: 'Eddard Stark' }, function (err) {});
           req.flash("success", "Successfully deleted.");
           res.redirect("/forumTopics");
       });
    });
});