

function init() {
    
    // listen to dropdown item clicks
    
    
    $("#time-dropdown").children().on("click", function (e) {
        e.preventDefault();
        try {
            console.log("here");
            var days = $(this).data("days");
            console.log("Requesting data for last " + days + " days.");
            getTodoistData(days);
        } catch (e) {
            console.error(e);
        }
        return false;
    });
    
    
    console.log("Index loaded.");
}


$(document).ready = init();