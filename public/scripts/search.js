$('#campground-search').on('input', function(){
    var search = $(this).serialize();
    if (search === "search="){
        search = "search=zyz12"
        console.log(search);
        $.get("/campgrounds?" + search, function(resultData){
            displayCampgrounds(resultData);
        });
    } else {
        $.get("/campgrounds?" + search, function(resultData){
        displayCampgrounds(resultData);
        });
    }
    function displayCampgrounds (resultData) {
            console.log(resultData);
        if (!resultData.result) {
            $("#campground-grid").html("");
            $("#campground-grid").append(`
                <div class="container">
                    <h4> No campgrounds match that query. </h4>
                </div>
            `);
        } else {
            $("#campground-grid").html("");
            resultData.campgrounds.forEach(function(campground){
                $("#campground-grid").append(`
                    <div class="col-md-3 col-sm-6">
                        <div class="thumbnail">
                            <img src="${campground.image.url}">
                            <div class="caption">
                                <h4> ${campground.name} </h4>
                            </div>
                            <p>
                                <a href="/campgrounds/${campground._id}" class="brn brn-primary">More Info </a>
                            </p>
                        </div>
                    </div>
                `);
            });
        }
    }
});
$("#campground-search").submit(function(event){
    event.preventDefault();
});