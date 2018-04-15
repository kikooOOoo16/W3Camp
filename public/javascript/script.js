/* global $ */
window.onload = function() { 
    // User page modal-form function
    var modal = document.getElementById('modal-form-coverimg');
    var btn = document.getElementById("coverimgBtn");
    var span = document.getElementsByClassName("modalform-closeBtn")[0];
    
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
    // Campground show page more info menu
    $("#campgroundMoreInfo-aboutTd").click(function(){
       $("#campgroundMoreInfo-aboutBtn").trigger("click");
       return false;
    });
}