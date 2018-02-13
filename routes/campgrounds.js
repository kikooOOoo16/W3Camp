var express         = require("express"),
    router          = express.Router(),
    Campground      = require("../models/campground"),
    middleware      = require("../middleware/index.js"),
    geocoder        = require("geocoder"),
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

// INDEX - show all campgrounds
router.get("/", function(req, res) {
    var resultData = {},
        queryResult;
    if(req.query.search && req.xhr && req.query.search !== "zyz12") {
        const regex = RegExp(escapeRegx(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds) {
            if (err) {
                req.flash("error", err.message);
                console.log(err);
            } else {
                    if (allCampgrounds.length < 1) { 
                        queryResult = false;
                    } else {
                        queryResult = true;
                    }
                resultData = {
                    campgrounds: allCampgrounds,
                    result: queryResult
                }   
                res.status(200).json(resultData);    
            }
        });
    } else if (req.query.search && req.xhr && req.query.search === "zyz12"){
            Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                req.flash("error", err.message);
                console.log(err);
            } else {
                        resultData = {
                        campgrounds: allCampgrounds,
                        result: true
                    }
                res.status(200).json(resultData); 
            }
        });
    } else {
        Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                req.flash("error", err.message);
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });
    }
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new"); 
});

// CREATE - add new campground to database
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res) {
    // get data from form and add to campground array
    geocoder.geocode(req.body.location, function(err, data) {
        //  eval(require('locus'));
        if (err || data.status != 'OK') {
            console.log(err + data.error_message);
            req.flash("error", data.error_message);
            res.redirect("back");
        } else {
            req.body.campground.lat = data.results[0].geometry.location.lat;
            req.body.campground.lng = data.results[0].geometry.location.lng;
            req.body.campground.location = data.results[0].formatted_address;
            
            cloudinary.uploader.upload(req.file.path, function(result){
                // add cloudinary url for the image to the campground object under image property
                // eval(require("locus"))
                req.body.campground.image = {
                    publicId: result.public_id,
                    url: result.secure_url
                }
                req.body.campground.author = {
                    id: req.user._id,
                    username: req.user.username
                }
                // Create a new campground and save to DB
                Campground.create(req.body.campground, function(err, newCampground){
                    if(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        // redirect back to campgruonds page
                        res.redirect("/campgrounds/" + newCampground.id);
                    }
                });
            });
        }
    });
});

// SHOW - Shows info about one particular campground 
router.get("/:id", function(req, res) {
    // find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            // render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground, googleMapsApi: process.env.GOOGLE_MAPS_API});
        }
    });
});

// EDIT CAMPGROUND
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
   Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
   });
});

// UPDATE CAMPGROUND
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    // find and update the correct campground
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || data.status != 'OK') {
            req.flash("error", err.message);
            console.log(err);
        } else if(req.file) {
            req.body.campground.lat = data.results[0].geometry.location.lat;
            req.body.campground.lng = data.results[0].geometry.location.lng;
            req.body.campground.location = data.results[0].formatted_address;
            // delete old image
            cloudinary.uploader.destroy(req.body.oldImagePublicId, function(error, result) {
                if (error) {
                    console.log(error);
                }
                console.log(result); 
            });
            // upload image info
            cloudinary.uploader.upload(req.file.path, function(result){
                // add cloudinary url for the image to the campground object under image property
                req.body.campground.image = {
                    publicId: result.public_id,
                    url: result.secure_url
                }
                req.body.campground.author = {
                    id: req.user._id,
                    username: req.user.username
                }
            // save new edited campground
                Campground.findByIdAndUpdate(req.params.id, {$set: req.body.campground}, function (err, updatedCampground){
                    if (err) {
                        req.flash("error", err.message);
                        res.redirect("back");
                    } else {
                        // redirect somewhere (show page)
                        req.flash("success", "Successfully Updated!");
                        res.redirect("/campgrounds/" + req.params.id);
                    }    
                });
            });
        } else {
            req.body.campground.lat = data.results[0].geometry.location.lat;
            req.body.campground.lng = data.results[0].geometry.location.lng;
            req.body.campground.location = data.results[0].formatted_address;
                 
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            }
            Campground.findByIdAndUpdate(req.params.id, {$set: req.body.campground}, function (err, updatedCampground){
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    // redirect somewhere (show page)
                    req.flash("success", "Successfully Updated!");
                    res.redirect("/campgrounds/" + req.params.id);
                }    
            });
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            req.flash("error", "Request partially executed.");
        } else {
            // delete image on cloudinare cloud server
           cloudinary.uploader.destroy(foundCampground.image.publicId, function(error, result) {
                if (error) {
                    console.log(error);
                }
                Campground.findByIdAndRemove(req.params.id, function(err){
                    if (err) {
                        req.flash("error", err.message);
                        console.log(err);
                        res.redirect("/campgrounds/" + req.params.id);
                    } else {
                        req.flash("success", "Successfully Deleted!");
                        res.redirect("/campgrounds");
                    }
                });
            });
        }
    });
});

function escapeRegx(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;