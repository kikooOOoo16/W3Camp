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
                    <div class="col-md-3 col-sm-6 col-xs-12">
                        <div class="thumbnail">
                            <img class="img-resize img-responsive" src="${campground.image.url}">
                            <div class="caption">
                                <h4> ${campground.name} </h4>
                                <p class="small">Prices starting at ${campground.price}</p>
                            </div>
                            <p>
                                <a class="btn btn-primary" href="/campgrounds/${campground._id}">More Info </a>
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