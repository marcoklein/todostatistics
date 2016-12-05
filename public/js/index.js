

function init() {
    
    // listen to dropdown item clicks
    
    
    $("#time-dropdown").children().on("click", function (e) {
        e.preventDefault();
        try {
            // request data for last x days
            var days = $(this).data("days");
            console.log("Requesting data for last " + days + " days.");
            getTodoistData(days);
            
            // update dropdown title
            $("#dropdownMenuButton").text($(this).text());
            console.log("text: " + $(this).text());
            
        } catch (e) {
            console.error(e);
        }
        return false;
    });
    
    
    
    console.log("Index loaded.");
}


$(document).ready = init();