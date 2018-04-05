var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    localStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    User        = require("./models/user"),
    seedDB      = require("./seeds");
    
//  dotenv setup
    require('dotenv').config();
    
//  requiring routes
var commentRoutes     = require("./routes/comments"),
    campgroundRoutes  = require("./routes/campgrounds"),
    indexRoutes       = require("./routes/index"),
    contactRoutes     = require("./routes/contact"),
    forumTopicsRoutes = require("./routes/forumTopics"),
    forumPostsRoutes  = require("./routes/forumPosts");

mongoose.Promise = global.Promise;
// mongoose.connect(process.env.DATABASE_URL, {useMongoClient: true});
mongoose.connect(process.env.MLAB_DATABASE_URL, {useMongoClient: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seed the database 
// seedDB();

// MOMENTJS CONFIGURATION
app.locals.moment = require("moment");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "I chose diferent, I chose the imposible, I chose Rapture",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware that passes data to all templates
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   res.locals.warning = req.flash("warning");
   next();
});

// use route files
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/contact", contactRoutes);
app.use("/forumTopics", forumTopicsRoutes);
app.use("/forumTopics/:id/forumPosts", forumPostsRoutes);


app.listen(process.env.PORT, process.env.ID, function() {
    console.log("The W3Camp server has started.");
});