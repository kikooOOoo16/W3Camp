var express         = require("express"),
    router          = express.Router(),
    Campground      = require("../models/campground"),
    middleware      = require("../middleware/index.js"),
    multer          = require("multer"),
    cloudinary      = require("cloudinary"),
    NodeGeocoder    = require('node-geocoder'),
    DarkSky         = require('forecast.io'),
    moment          = require("moment"),
    momentTimezone  = require("moment-timezone");


// FORECAST config 
var options = {
    APIKey: process.env.FORECAST_SECRET_KEY,
    timeout: 1000
},

darksky = new DarkSky(options);

// NODE GEOCODER config
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GOOGLE_GEOCODER_API,
  formatter: null
};

var geocoder = NodeGeocoder(options);
    
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
        queryResult,
        perPage = 8,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1;
    if(req.query.search && req.xhr) {
        const regex = RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds) {
            if (err) {
                req.flash("error", err.message);
                console.log("Search error: " + err);
                return res.redirect("/campgrounds");
            } 
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
        });
        } else {
            // Get all campgrounds
            Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
                Campground.count().exec(function (err, count) {
                    if (err) {
                        req.flash("error", err.message);
                        console.log(err);
                    } else {
                        res.render("campgrounds/index", {
                            campgrounds: allCampgrounds,
                            current: pageNumber,
                            pages: Math.ceil(count / perPage),
                            page: "campgrounds",
                            search: false
                        });
                    }
                });
            });
        }
    });

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new", {page: "newCampground"}); 
});

// CREATE - add new campground to database
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res) {
    // get data from form and add to campground array
    geocoder.geocode(req.body.location, function(err, data) {
        if (err || !data.length) {
            console.log("GEOCODER ERR: " + err);
            req.flash("error", "Invalid campground location.");
            return res.redirect("back");
        }
        
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
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
    });
});

// SHOW - Shows info about one particular campground 
router.get("/:id", function(req, res) {
    var showPage = "showCampground";
    // find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", err.message);
            return res.redirect("back");
        } else {
            var options = {
                exclude: 'minutely,hourly,flags,alerts',
                units: 'si'
            };
            darksky.get(foundCampground.lat, foundCampground.lng, options, function (err, ress, data) {
                if(err) return console.log(err);
                // format UNIX timestamp and timezone
                var dateString = moment.unix(data.currently.time);
                var tzFormatted = moment(dateString).tz(data.timezone).format("MMM/DD/YY HH:mm"); 
                // determine correct icon and background to display for weather widget
                var currentlyIcon = weatherIconDeterminator(data.currently.icon);
                var weatherBackground = weatherBackgroundDeterminator (data.currently.icon);
                // generate week days for weather widget
                var dailyWeather = weatherWeekDaysGenerator(data, dateString);
                // eval(require("locus"))
            res.render("campgrounds/show", {campground: foundCampground, googleMapsApi: process.env.GOOGLE_MAPS_API, weather: data, weatherTime: tzFormatted, currentlyIcon: currentlyIcon, weatherBackground: weatherBackground, dailyWeather: dailyWeather, page : showPage});
            });
        }
    });
});

// EDIT CAMPGROUND
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
   Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground, page: "editCampground"});
   });
});

// UPDATE CAMPGROUND
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res) {
    // find and update the correct campground
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash("error", err.message);
            console.log(err);
            return res.redirect("back");
        }
        if(req.file) {
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
            
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
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
        
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
                    console.log("Cloudinary image destory err : " + error);
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

// FUNCTIONS
function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function weatherBackgroundDeterminator (inputIcon) {
    var weatherBackground = "";
    switch (inputIcon) {
        case 'clear-day':
            weatherBackground = "../images/weatherImages/clear-day.jpg";
            break;
        case 'clear-night':
            weatherBackground = "../images/weatherImages/clear-night.jpg";
            break;
        case 'rain' :
            weatherBackground = "../images/weatherImages/rain.jpg";
            break;
        case 'snow' :
        case 'sleet':
            weatherBackground = "../images/weatherImages/snow.jpg";
            break;
        case 'wind' :
            weatherBackground = "../images/weatherImages/wind.jpg";
            break;
        case 'fog' :
            weatherBackground = "../images/weatherImages/fog.jpg";
            break;
        case 'cloudy' :
        case 'partly-cloudy-day' :
            weatherBackground = "../images/weatherImages/cloudy-day.jpg";
            break;
        case 'cloudy' :
        case 'partly-cloudy-night' :
            weatherBackground = "../images/weatherImages/cloudy-night.jpg";
            break;
        default : 
            weatherBackground = "../images/weatherImages/clear-day.jpg"
    }
    return weatherBackground;
}

function weatherIconDeterminator(inputIcon) {
    var outputIcon = '';
    switch (inputIcon) {
        case 'clear-day' : 
            outputIcon = 'wi-day-sunny'; 
            break;
        case 'clear-night' : 
            outputIcon = 'wi-night-clear';
            break;
        case 'rain' : 
            outputIcon = 'wi-rain';
            break;
        case 'snow' : 
            outputIcon = 'wi-snow';
            break;
        case 'sleet' : 
            outputIcon = 'wi-hail';
            break;
        case 'wind' : 
            outputIcon = 'wi-windy';
            break;
        case 'fog' : 
            outputIcon = 'wi-fog';
            break;
        case 'cloudy' : 
            outputIcon = 'wi-cloudy' ;
            break;
        case 'partly-cloudy-day' : 
            outputIcon = 'wi-day-cloudy';
            break;
        case 'partly-cloudy-night' : 
            outputIcon = 'wi-night-alt-cloudy';
            break;
        default: outputIcon = 'wi-na';
    }
    return outputIcon;
}

function weatherWeekDaysGenerator (data, currentDate) {
    var days = [];
    for (var i = 0; i < data.daily.data.length; i++) {
        days.push ({
            date : moment(currentDate).add(i+1,'d').format("dddd"),
            icon : weatherIconDeterminator(data.daily.data[i].icon),
            temperatureMin : data.daily.data[i].temperatureMin,
            temperatureMax : data.daily.data[i].temperatureMax
        });
    }
    return days;
}
module.exports = router;