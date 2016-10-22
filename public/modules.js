
/* global _, google */


/**
 * Modules build up the dashboard and contain logic for how to render data.
 * 
 * Client data is held locally in the TodoistData object.
 * 
 */


/**
 * Holds client data Modules can use.
 * 
 * @type type
 */
var TodoistData = {
    /* All client data recieved by a sync request. */
    sync: null,
    /* All completed items and projects. May take long to load. */
    completed: null
};



/**
 * Each Module must override the render() method. Render() is called if the
 * gets rendered.
 */


google.charts.load('current', {'packages': ['corechart', "bar"]});

var ProjectsAndItemsPieChart = {
    render: function () {
        var todoistData = TodoistData.sync;

        var dataArray = [["Project", "Number of Items"]];

        var itemCountArray = _.map(todoistData.projects, function (project) {
            return _.filter(todoistData.items, function (item) {
                return item.project_id === project.id;
            }).length;
        });

        for (var i = 0; i < todoistData.projects.length; i++) {
            dataArray.push([
                todoistData.projects[i].name,
                itemCountArray[i]
            ]);
        }

        var data = google.visualization.arrayToDataTable(
                dataArray);

        var options = {
            title: 'Projects'
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(data, options);
    }
};

var NumberOfItemsPerCompletedProjectChart = {
    render: function () {
        if (!TodoistData.completed) {
            return; // completed is needed
        }
        
        
        var todoistData = TodoistData.completed;
        
        // extract project to access projects later
        var completedProjects = _.values(todoistData.projects);
        
        var projects = $.merge(completedProjects, TodoistData.sync.projects);
        
        
        console.log("Projects: " + projects);
        
        var dataArray = [['Project', 'Number of Items']];

        var itemCountArray = _.map(projects, function (project) {
            return _.filter(todoistData.items, function (item) {
                return "" + item.project_id === "" + project.id;
            }).length;
        });

        // TODO fasse projekte mit gleichem namen zusammen
        for (var i = 0; i < projects.length; i++) {
            dataArray.push([
                projects[i].name,
                itemCountArray[i]
            ]);
        }

        var data = google.visualization.arrayToDataTable(
                dataArray);

        var options = {
            title: 'Completed Projects'
        };

        var chart = new google.visualization.PieChart(document.getElementById('completed_projects'));

        chart.draw(data, options);
        
        
        
        
    }
};

var NumberOfItemsPerDayColumnChart = {
    render: function () {
        if (!TodoistData.completed) {
            return; // no completed data
        }
        console.log("Response completed request.");

        var completedItems = TodoistData.completed.items;

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


        //console.log(JSON.stringify(arrayData));


        var dataArray = $.merge([["Element", "Density", {role: "style"}]], arrayData);

        var data = google.visualization.arrayToDataTable(dataArray);

        var view = new google.visualization.DataView(data);
        view.setColumns([0, 1,
            {calc: "stringify",
                sourceColumn: 1,
                type: "string",
                role: "annotation"},
            2]);

        var options = {
            title: "Completed Items per Weekday",
//            width: 600,
//            height: 400,
            bar: {groupWidth: "95%"},
            legend: {position: "none"}
        };
        var chart = new google.visualization.ColumnChart(document.getElementById("chart_most_productive_day"));
        chart.draw(view, options);
    }
};

var NumberOfItemsPerCompletedProjectChart = {
    render: function () {
        if (!TodoistData.completed) {
            return; // completed is needed
        }
        
        
        var todoistData = TodoistData.completed;
        
        // extract project to access projects later
        var completedProjects = _.values(todoistData.projects);
        
        var projects = $.merge(completedProjects, TodoistData.sync.projects);
        
        
        console.log("Projects: " + projects);
        
        var dataArray = [['Project', 'Number of Items']];

        var itemCountArray = _.map(projects, function (project) {
            return _.filter(todoistData.items, function (item) {
                return "" + item.project_id === "" + project.id;
            }).length;
        });

        // TODO fasse projekte mit gleichem namen zusammen
        for (var i = 0; i < projects.length; i++) {
            dataArray.push([
                projects[i].name,
                itemCountArray[i]
            ]);
        }

        var data = google.visualization.arrayToDataTable(
                dataArray);

        var options = {
            title: 'Completed Projects'
        };

        var chart = new google.visualization.PieChart(document.getElementById('completed_projects'));

        chart.draw(data, options);
        
        
        
        
    }
};

var CompletedDateScatterChart = {
    render: function () {
        if (!TodoistData.completed) {
            return; // no completed data
        }
        console.log("Response completed request.");

        var completedItems = TodoistData.completed.items;

        var dataArray = [["Counter", "Time"]];

        for (var i = 0; i < completedItems.length; i++) {
            var completedDate = convertDateToMoment(completedItems[i].completed_date);
            dataArray.push([
                i, 
                completedDate.hours() + completedDate.minutes() / 60
            ]);
        }


        //console.log(JSON.stringify(dataArray));

        var data = google.visualization.arrayToDataTable(dataArray);

        var options = {
            title: "Completed Todo Time",
            vAxis: {title: 'Time', minValue: 0, maxValue: 24},
            legend: {position: "none"}
        };
        var chart = new google.visualization.ScatterChart(document.getElementById("chart_most_productive_time"));
        chart.draw(data, options);
    }
};

function getTodoistData() {
    $.post("/API/v7/sync", function (res) {
        TodoistData.sync = JSON.parse(res);
        renderDashboard();
    });
    
    $.post("/API/v7/completed/get_all", function (res) {
        TodoistData.completed = JSON.parse(res);
        renderDashboard();
    });
    
}

/**
 * Goes through the array of available modules and calls render on them.
 * 
 * @returns {undefined}
 */
function renderDashboard() {
    for (var i = 0; i < AvailableModules.length; i++) {
        AvailableModules[i].render();
    }
}


google.charts.setOnLoadCallback(function () {
    getTodoistData();
});


/**
 * If you write a new module add it here so your module code gets executed.
 * 
 * Holds all available modules.
 * 
 * @type Array
 */
var AvailableModules = [
    ProjectsAndItemsPieChart,
    NumberOfItemsPerDayColumnChart,
    NumberOfItemsPerCompletedProjectChart,
    CompletedDateScatterChart
];

/**
 * Make charts responsive.
 * 
 * @type type
 */
$(window).resize(function(){
    renderDashboard();
});