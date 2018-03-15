$('#campground-search').on('input', function(){
    var search = $(this).serialize();
    if (search === "search="){
        search = "search=all!!";
        $.get("/campgrounds?" + search, function(resultData){
            displayCampgrounds(resultData);
        });
    } else {
        $.get("/campgrounds?" + search, function(resultData){
        displayCampgrounds(resultData);
        });
    }
    function displayCampgrounds (resultData) {
        if (!resultData.result) {
            $("#campground-grid").html("");
            $("#campground-grid").append(`
                <div class="container">
                    <h4 class="mb-2 mt-2"> No campgrounds match that query. </h4>
                </div>
            `);
        } else {
            $("#campground-grid").html("");
            resultData.campgrounds.forEach(function(campground){
                $("#campground-grid").append(`
                    <div class="col-8 col-md-4 col-lg-3">
                        <div class="card bg-light mb-4">
                            <img class="card-image-top img-resize img-responsive" src="${campground.image.url}">
                            <div class="card-title mt-2">
                                <h5> ${campground.name} </h5>
                                <p class="card-text">Prices starting at ${campground.price}</p>
                            </div>
                            <p>
                                <a class="btn card-link btn-primary hvr-grow" href="/campgrounds/${campground._id}">More Info </a>
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