/* global $ */
window.onload = function() { 
    
    addNavbarShrinkClass();
    
    if($('body').hasClass('userPageClass')) {
        userCoverImgForm();
    } 
    
    if($('body').hasClass('showCampgroundPageClass')) {
        campgroundMoreInfoMenu();
    } 
};
        
//_____________________ FUNCTIONS _______________________//
var userCoverImgForm = function () {
    // User page modal-form function
    var modal = document.getElementById('modal-form-coverimg');
    var btn = document.getElementById("coverimgBtn");
    var span = document.getElementsByClassName("modalform-closeBtn")[0];
    
    if (btn && span && modal) {
        btn.onclick = function() {
            modal.style.display = "block";
        };
        span.onclick = function() {
            modal.style.display = "none";
        };
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    }
};
// Campground show page more info menu
var campgroundMoreInfoMenu = function () {
    $('#campgroundMoreInfo-aboutTr').click(function () {
       $('#campgroundMoreInfo-aboutBtn')[0].click();
    });
    $('#campgroundMoreInfo-bookTr').click(function () {
       $('#campgroundMoreInfo-bookBtn')[0].click();
    });
};
// Navbar shrink class toggle
var addNavbarShrinkClass = function() {
    $(window).scroll(function() {
        if ($(document).scrollTop() > 40 && $(window).width() > 766) {
            $('nav').addClass('shrink');
        }
        else {
            $('nav').removeClass('shrink');
        }
    });
}