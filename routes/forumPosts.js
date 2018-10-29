var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    ForumPost   = require("../models/forumPost"),
    ForumTopic  = require("../models/forumTopic"),
    LatestPosts = require("../models/latestPosts"),
    User        = require("../models/user"),
    middleware  = require("../middleware/index.js"),
    moment      = require("moment");

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
            User.findByIdAndUpdate(req.user._id, { $set: { postsCount: req.user.postsCount + 1}}, function(err, updatedUser) {
                if (err) {
                    req.flash("error", "There was a problem while updating the user posts counter.");
                    return res.redirect("/forumTopics/" + req.params.id);
                }
                // GENERATE NEW POST DATA AND SAVE THE NEW POST TO THE FORUM TOPIC
                newPost.author.id = req.user._id;
                newPost.author.username = req.user.username;
                newPost.author.avatarImgUrl = req.user.avatarImg.url;
                newPost.author.isAdmin = req.user.isAdmin;
                newPost.author.postsCount = updatedUser.postsCount + 1;
                newPost.author.createdAt = moment(updatedUser.createdAt, "MMM-DD-YYYY");
                newPost.forumTopic = foundForumTopic.name;
                newPost.forumTopicId = foundForumTopic.id;
                newPost.isLatest = true;
                newPost.save();
                foundForumTopic.posts.push(newPost); 
                foundForumTopic.save();
                // UPDATE POSTSCOUNT TO ALL POSTS FROM THE USER
                ForumPost.update({'author.id' : req.user._id}, { $set: {'author.postsCount': updatedUser.postsCount + 1} }, {multi: true }, function (err, updatePostsRes) {
                    if (err) {
                        req.flash("error", "There was an error while updating the posts count value of all your posts.");
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
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
                            // UPDATE ISLATEST POST VALUE TO FALSE OF THE POST REMOVED
                            ForumPost.findOneAndUpdate({'text' : latestPostsArray.posts[0].text}, {'isLatest' : false}, function (err, updatedPost) {
                               if (err) {
                                    req.flash("error", "There was an error while updating the latest posts property.");
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
    ForumPost.findByIdAndRemove(req.params.post_id, function (err, postToDelete) {
        if (err) {
            req.flash("error", "There was an error deleting your post.");
            return res.redirect("/forumTopics/" + req.params.id);
        }
        // REMOVE POST ID REFERENCE FROM POST TOPIC OBJECT  
        ForumTopic.findByIdAndUpdate(postToDelete.forumTopicId, {$pull: {posts: postToDelete.id}}, {safe: true, upsert: true}, function (err) {
            if (err) {
                req.flash("error", "There was an error with the latest posts functionality.");
                return res.redirect("/forumTopics");
            }
            // GET THE LATEST POSTS ARRAY
            LatestPosts.findById('5ac5fbdea52ff006dcae2c78', function (err, latestPostsArray) {
                if (err) {
                    req.flash("error", "There was an error with the latest posts functionality.");
                    return res.redirect("/forumTopics");
                }
                // CHECK AND DELETE IF THE POST THAT WE WANT TO DELETE IS IN THE LATEST POSTS ARRAY
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
                // REDUCE THE POSTS COUNTER OF THE USER WHOSE POST GOT DELETED 
                User.findByIdAndUpdate(postToDelete.author.id, { $set: { postsCount: req.user.postsCount - 1}}, function(err, updatedUser) {
                    if (err) {
                        req.flash("error", "There was a problem while updating the user posts counter.");
                        return res.redirect("/forumTopics/" + req.params.id);
                    }
                    // REDUCE THE POSTS COUNTER ON ALL THE POSTS THAT BELONG TO THIS USER
                    ForumPost.update({'$and': [{'author.id' : postToDelete.author.id}, {_id: {'$ne': req.params.post_id} }]}, { $set: {'author.postsCount': updatedUser.postsCount - 1} }, {multi: true }, function (err, updatePostsRes) {
                        if (err) {
                            req.flash("error", "There was an error while updating the posts count value of all your posts.");
                            console.log(err);
                            return res.redirect("/campgrounds");
                        }
                        req.flash("success", "Post successfully deleted.");
                        res.redirect("/forumTopics/" + req.params.id);
                    });
                });
            });
        });
    });
});

module.exports = router;