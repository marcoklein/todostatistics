



/* global _, google */

google.charts.load('current', {'packages': ['corechart', "bar"]});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
    console.log("Post request");
    $.post("/API/v7/sync", function (res) {
        var todoistData = JSON.parse(res);

        var dataArray = [['Task', 'Hours per Day']];
        
        var itemCountArray = _.map(todoistData.projects, function (project) {
            return _.filter(todoistData.items, function (item) {
                return item.project_id === project.id;
            }).length;
        });

        for (var i = 0; i < todoistData.projects.length; i++) {
            dataArray.push([
                todoistData.projects[i].name,
                itemCountArray[i]
            ]

                    );
        }

        var data = google.visualization.arrayToDataTable(
                dataArray);

        var options = {
            title: 'Projects'
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(data, options);
        
        
    });
    
    
        console.log("Making completed request.");
    $.post("/API/v7/completed/get_all", function (res) {
        console.log("Response completed request.");
        var completedItems = JSON.parse(res);
        
        var weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        var shortWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        
        
        var shortWeekdays = _.map(shortWeekdays, function (day) {
            return _.filter(completedItems, function (item) {
                return item.completed_date.startsWith(day);
            }).length;
        });
        
        var arrayData = [];
        
        for (var i = 0; i < weekdays.length; i++) {
            arrayData.push([weekdays[i], shortWeekdays[i], "blue"]);
        }
        
        
        console.log(JSON.stringify(arrayData));
        
        
        var dataArray = $.merge([["Element", "Density", {role: "style"}]], arrayData);
        console.log(JSON.stringify(dataArray));
        
        var data = google.visualization.arrayToDataTable(dataArray);

        var view = new google.visualization.DataView(data);
        view.setColumns([0, 1,
            {calc: "stringify",
                sourceColumn: 1,
                type: "string",
                role: "annotation"},
            2]);

        var options = {
            title: "Density of Precious Metals, in g/cm^3",
            width: 600,
            height: 400,
            bar: {groupWidth: "95%"},
            legend: {position: "none"},
        };
        var chart = new google.visualization.ColumnChart(document.getElementById("chart_most_productive_day"));
        chart.draw(view, options);

    
    });
    
}