var mongoose = require("mongoose"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment");

var data = [
    {
        name: "Cloud's Rest",
        image: "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?auto=format&fit=crop&w=1350&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis nibh bibendum, iaculis quam non, fermentum lectus. Fusce id arcu aliquet ante tincidunt vehicula eu nec erat. Pellentesque non quam libero. Maecenas tempor semper neque at placerat. Nulla at lectus est. Suspendisse rhoncus ipsum sit amet erat sodales sagittis. Nullam non volutpat libero, vel congue eros. Curabitur at ligula non risus venenatis gravida. Integer luctus risus ex, nec semper urna tincidunt at. Nam ac mi id velit porttitor convallis at feugiat nisl. Cras tempus lobortis laoreet. "
    },
    {
        name: "Desert Mesa",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1308&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Morbi laoreet commodo augue a commodo. Maecenas in elementum nulla. Nullam eu elit ut nisi molestie luctus. Sed mi magna, dapibus quis ex et, pharetra interdum nulla. Mauris vitae mi ornare, rutrum quam a, bibendum sem. Fusce porttitor orci in nunc elementum condimentum. Nullam arcu leo, venenatis eu urna non, imperdiet sollicitudin odio. "
    },
    {
        name: "Canyon Floor",
        image: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?auto=format&fit=crop&w=1353&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Morbi mattis urna in neque fermentum, quis tristique leo pharetra. Fusce eu velit neque. Vivamus et ante eu tortor iaculis rutrum nec quis leo. Etiam eu turpis pulvinar, vulputate est vel, elementum leo. Nunc quis arcu sed magna ullamcorper fringilla. Morbi porttitor id nulla ut blandit. Cras eget laoreet libero. Vestibulum sed libero interdum, lobortis lacus id, accumsan ante. Integer consectetur faucibus vestibulum. Aliquam pretium mauris egestas, lobortis ligula non, bibendum tortor. "
    }
]

function seedDB() {
    // Remove all campgrounds
    Campground.remove({}, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("remove campgrounds");
            // add a few campgrounds
            data.forEach(function(seed) {
                Campground.create(seed, function(err, campground) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("added a campground");
                        // add a few comments
                        Comment.create({
                            text: "This place is great, but I wish there was internet",
                            author: "Homer"
                        }, function(err, comment){
                            if (err) {
                                console.log(err);
                            } else {
                                campground.comments.push(comment);
                                campground.save();
                                console.log("Created new comment");
                            }
                        });
                    }
                });    
            });
        }
    });
}

module.exports = seedDB;
