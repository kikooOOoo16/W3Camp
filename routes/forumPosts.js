var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    ForumPost   = require("../models/forumPost"),
    ForumTopic  = require("../models/forumTopic"),
    middleware  = require("../middleware/index.js");

// CREATE POST
router.post("/", middleware.isLoggedIn, function (req, res) {
    ForumTopic.findById(req.params.id, function (err, foundForumTopic) {
        if (err) {
            req.flash("error", "There was an error while finding the forum topic.");
            return res.redirect("/forumTopics/" + req.params.id);
        }
        ForumPost.create(req.body.newPost, function (err, newPost) {
            if (err) {
                req.flash("error", "There was an error while creating your new post.");
                return res.redirect("/forumTopics/" + req.params.id);
            }
            newPost.author.id = req.user._id;
            newPost.author.username = req.user.username;
            newPost.author.avatarImgUrl = req.user.avatarImg.url;
            newPost.author.isAdmin = req.user.isAdmin;
            newPost.save();
            foundForumTopic.posts.push(newPost);
            foundForumTopic.save();
            req.flash("success", "Added your new post successfully.");
            res.redirect("/forumTopics/" + req.params.id);
        });
    });
});

// UPDATE post
router.put("/:post_id", middleware.checkForumPostOwnership, function (req, res) {
    ForumPost.findByIdAndUpdate(req.params.post_id, req.body.post, function (err, updatedPost) {
        if (err) {
            req.flash("error", "There was an error while trying to update your post.");
            return res.redirect("/forumTopics/" + req.params.id);
        }
        req.flash("success", "Post updated successfully");
        res.redirect("/forumTopics/" + req.params.id);
    });
});

// DELETE post
router.delete("/:post_id", middleware.checkForumPostOwnership, function (req, res) {
    ForumPost.findByIdAndRemove(req.params.post_id, function (err) {
        if (err) {
            req.flash("error", "There was an error deleting your post.");
            return res.redirect("/forumTopics/" + req.params.id);
        }
        req.flash("success", "Post successfully deleted.");
        res.redirect("/forumTopics/" + req.params.id);
    });
});

module.exports = router;