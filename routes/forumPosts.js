var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    ForumPost   = require("../models/forumPost"),
    ForumTopic  = require("../models/forumTopic"),
    LatestPosts = require("../models/latestPosts"),
    middleware  = require("../middleware/index.js");

// CREATE POST
router.post("/", middleware.isLoggedIn, function (req, res) {
    // FIND FORUM TOPIC
    ForumTopic.findById(req.params.id, function (err, foundForumTopic) {
        if (err) {
            req.flash("error", "There was an error while finding the forum topic.");
            return res.redirect("/forumTopics/" + req.params.id);
        }
        // CREATE NEW POST OBJECT 
        ForumPost.create(req.body.newPost, function (err, newPost) {
            if (err) {
                req.flash("error", "There was an error while creating your new post.");
                return res.redirect("/forumTopics/" + req.params.id);
            }
            // GENERATE NEW POST DATA AND SAVE THE NEW POST TO THE FORUM TOPIC
            newPost.author.id = req.user._id;
            newPost.author.username = req.user.username;
            newPost.author.avatarImgUrl = req.user.avatarImg.url;
            newPost.author.isAdmin = req.user.isAdmin;
            newPost.save();
            foundForumTopic.posts.push(newPost);
            foundForumTopic.save();
            // PUSH NEW POST TO LATEST POSTS ARRAY 
            var latestPost = {
                postTopicId: foundForumTopic.id,
                postTopic: foundForumTopic.name,
                text: newPost.text,
                createdAt: newPost.createdAt,
                author: newPost.author
            }
            LatestPosts.findById('5ac5fbdea52ff006dcae2c78', function(err, latestPostsArray) {
                if (err) {
                    req.flash("error", "There was an error with the latest posts functionality.");
                    return res.redirect("/campgrounds");
                }
                // DELETE OLDEST POST IF THERE ARE 5 POSTS IN THE RECENT POSTS ARRAY
                if (latestPostsArray.posts.length >= 5) {
                    LatestPosts.findOneAndUpdate('5ac5fbdea52ff006dcae2c78', {$pull: {posts : {_id : latestPostsArray.posts[0]._id } } }, function (err, updatedLatestPostsArray) {
                        if (err) {
                            req.flash("error", "There was an error while updating the latest posts array.");
                            return res.redirect("/forumTopics/" + req.params.id);
                        }
                    });
                }
                // ADD NEW POST TO THE RECENT POSTS ARRAY
                latestPostsArray.posts.push(latestPost);
                latestPostsArray.save();
                req.flash("success", "Added your new post successfully.");
                res.redirect("/forumTopics/" + req.params.id);
            });
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
        LatestPosts.findById('5ac5fbdea52ff006dcae2c78', function(err, latestPostsArray) {
            if (err) {
                req.flash("error", "There was an error with the latest posts functionality.");
                return res.redirect("/campgrounds");
            }
            for (var i = 0; i < latestPostsArray.posts.length; i++) {
                if (req.body.postText === latestPostsArray.posts[i].text) {
                    LatestPosts.findOneAndUpdate('5ac5fbdea52ff006dcae2c78', {$pull: {posts : {_id : latestPostsArray.posts[i]._id } } }, function (err, updatedLatestPostsArray) {
                        if (err) {
                            req.flash("error", "There was an error while updating the latest posts array.");
                            return res.redirect("/forumTopics/" + req.params.id);
                        }
                    });
                }
            }
            req.flash("success", "Post successfully deleted.");
            res.redirect("/forumTopics/" + req.params.id);
        });
    });
});

module.exports = router;