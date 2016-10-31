
/* global _, google, ModuleUtils, dataProcessManager, moment */


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
    completed: null,
    /* All activity items and projects. May take long to load. */
    activity: null
};

var TodoistProjectColors = [
    "#95ef63",
    "#ff8581", "#ffc471", "#f9ec75", "#a8c8e4", "#d2b8a3", "#e2a8e4", "#cccccc", "#fb886e", "#ffcc00", "#74e8d3", "#3bd5fb",
    "#dc4fad", "#ac193d", "#d24726", "#82ba00", "#03b3b2", "#008299", "#5db2ff", "#0072c6", "#000000", "#777777"
];


/**
 * Each Module must override the render() method. Render() is called if the
 * gets rendered.
 */


google.charts.load('current', {'packages': ['corechart', "bar"]});

var ProjectsAndItemsPieChart = {
    render: function (renderData) {
        if (!renderData.sync) {
            return;
        }
        var todoistData = renderData.sync;

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

        $(".piechart").each(function (index, element) {
            var chart = new google.visualization.PieChart(element);
            chart.draw(data, options);
        });
    }
};

var MostCompletedItem = {
    render: function () {
        if (!TodoistData.completed) {
            return; // completed is needed
        }
        
        // get completed items
        var items = TodoistData.completed.items;
        
        var mostCompletedItem = "<None Completed>";
        var number = 0;
        
        _.each(items, function (item) {
            
            var numberOfCurrent = _.filter(items, function (itemFilter) {
                return itemFilter.content === item.content; // compare only names
            }).length;
            
            if (numberOfCurrent > number) {
                // replace most completed item
                number = numberOfCurrent;
                mostCompletedItem = item.content;
            }
            
        });

        // most_completed_item
        $("#most_completed_item h1").text(mostCompletedItem);
        $("#most_completed_item h3").text("was completed " + number + " times");
        
    }
};
   
/**
 * Item which has been postponed the most.
 * 
 * @type type
 */
var MostPostponedItem = {
    render: function () {
        if (!TodoistData.activity) {
            return; // completed is needed
        }
        
        // get activity
        var activity = TodoistData.activity.items;
        
        var mostPostponedItem = "<None Postponed>";
        var number = 0;
        
        
        // filter out all none items
        var itemActivity = _.filter(activity, function (itemFilter) {
            return itemFilter.event_type === "updated" && itemFilter.object_type === "item";
        });
        
        // compare only active items
        var items = TodoistData.sync.items;
        
        _.each(items, function (log) {
            
            var postponedCount = _.filter(itemActivity, function (itemFilter) {
                if (log.content === itemFilter.extra_data.content) {
                    // both items match each other
                    // test if the item is really postponed
                    
                    var lastDueDate = ModuleUtils.convertDateToMoment(itemFilter.extra_data.last_due_date);
                    var dueDate = ModuleUtils.convertDateToMoment(itemFilter.extra_data.due_date);
                    
                    var completedDate = ModuleUtils.convertDateToMoment(itemFilter.event_date);
                    
                    // last Due Date before current due date?
                    if (dueDate.year() <= completedDate.year()
                            && dueDate.month() <= completedDate.month()
                            && dueDate.days() <= completedDate.days()) {
                        // yes its before the day or on the occuring day
                        
                        // really postponed?
                        if (dueDate.year() <= lastDueDate.year()
                                && dueDate.month() <= lastDueDate.month()
                                && dueDate.days() <= lastDueDate.days()) {
                            // really postponed
                            return true;
                        }
                    }
                }
                return false;
            }).length;
            
            if (postponedCount > number) {
                number = postponedCount;
                mostPostponedItem = log.content;
            }
        });

        // most_completed_item
        $("#most_postponed_item h1").text(mostPostponedItem);
        $("#most_postponed_item h3").text("was postponed " + number + " times");
        
    }
};

var NumberOfPostpones = {
    render: function(renderData) {
        
        var processedData = dataProcessManager.process("postponed-active-items", renderData);
        if (!processedData) {
            return;
        }
        
        var count = 0;
        _.each(processedData, function (item) {
            count += item.postponed_count;
        });
        
        // most_completed_item
        $(".number-of-postpones h1").text(count);
        $(".number-of-postpones h3").text("Postpones.");
        
    }
}

var NumberOfItemsPerCompletedProjectChart = {
    render: function (renderData) {
        var processedData = dataProcessManager.process("completed-items-per-active-project", renderData);
        if (!processedData) {
            return;
        }
        
        // set project names as labels
        var labels = _.map(processedData, function (data) {
            return data.project.name;
        });
        
        // fill dataset for chart
        var dataset = {};
        
        dataset.data = _.map(processedData, function (data) {
            return data.item_count;
        });
        dataset.backgroundColor = _.map(processedData, function (data) {
            return TodoistProjectColors[data.project.color];
        });


        var chartData = {
            labels: labels,
            datasets: [
                dataset
            ]
        };



        var options = {
            label: 'Completed Items per Active Project'
        };
        
        

        var ctx = document.getElementById("completed-items-per-active-project");

        var myPieChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: options
        });
        
    }
};

var MostActiveProject = {
    render: function (data) {
        var processedData = dataProcessManager.process("completed-items-per-active-project", data);
        if (!processedData) {
            return;
        }
        
        var mostActiveProject = "<None Completed>";
        if (processedData.length > 0) {
            mostActiveProject = _.sortBy(processedData, "item_count")[processedData.length - 1].project.name;
        }
        
        $(".most-active-project h1").text(mostActiveProject);
    }
};

var NumberOfCompletedItemsPerActiveProjectChart = {
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
        /*
         * Alle completed items haben entweder ein projekt, das auch bereits completed ist
         * oder ein noch aktives projekt.
         * 
         */
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
        var sum = 0;
        
        
        for (var i = 0; i < shortWeekdays.length; i++) {
            sum += shortWeekdays[i];
        }

        // make percent out of it
        shortWeekdays = _.map(shortWeekdays, function (number) {
            return Math.floor((number / sum) * 100);
        });


        for (var i = 0; i < weekdays.length; i++) {
            arrayData.push([weekdays[i], shortWeekdays[i], "blue"]);
        }

        //console.log(JSON.stringify(arrayData));


        var dataArray = $.merge([["Element", "Percent", {role: "style"}]], arrayData);

        var data = google.visualization.arrayToDataTable(dataArray);

        var view = new google.visualization.DataView(data);
        view.setColumns([0, 1,
            {calc: "stringify",
                sourceColumn: 1,
                type: "string",
                role: "annotation"},
            2]);

        var options = {
            title: "Distribution of completed items",
//            width: 600,
//            height: 400,
            bar: {groupWidth: "95%"},
            legend: {position: "none"}
        };
        var chart = new google.visualization.ColumnChart(document.getElementById("chart_most_productive_day"));
        chart.draw(view, options);
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
            var completedDate = ModuleUtils.convertDateToMoment(completedItems[i].completed_date);
            dataArray.push([
                i, 
                completedDate.hours() + completedDate.minutes() / 60
            ]);
        }
        
         if (!TodoistData.activity) {
             console.log("Bkas");
            return; // no completed data
        }
        var activityItems = TodoistData.activity.items;
//        console.log("activity Items retreived");
//        console.log(activityItems.length + " items in activity log");
//        for (var i = 0; i < 20; i++) {
//            console.log("" + activityItems[i].id);
//        }

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

var ItemsWithPriority = {
    render: function(renderData) {
        var processedData = dataProcessManager.process("number-of-active-items-with-priority", renderData);
        if (!processedData) {
            return;
        }
        
        
        // most_completed_item
        $(".items-with-priority h1").text(processedData);
        $(".items-with-priority h3").text("Items have a priority.");
    }
};

/**
 * Retrieves Todoist data.
 * 
 * @returns {undefined}
 */
function getTodoistData() {
    $.post("/API/v7/sync", function (res) {
        TodoistData.sync = JSON.parse(res);
        renderDashboard();
    });
    
    // get only items for last 7 days
    var dateSince = moment().subtract(7,'d').format("YYYY-MM-DDTHH:MM");
    
    console.log("Date since: " + dateSince);
    
    $.post("/API/v7/completed/get_all",
            {
                since: dateSince
            },
            function (res) {
                TodoistData.completed = JSON.parse(res);
                renderDashboard();
            });
    
    $.post("/API/v7/activity/get",
            {
                since: dateSince
            },
            function (res) {
                TodoistData.activity = JSON.parse(res);
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
        AvailableModules[i].render(TodoistData);
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
//    NumberOfItemsPerCompletedProjectChart,
    MostCompletedItem,
    CompletedDateScatterChart,
    MostPostponedItem,
    MostActiveProject,
    NumberOfPostpones,
    ItemsWithPriority
];


/**
 * Make charts responsive.
 * 
 * @type type
 */
var resizeTimeout = null;
$(window).resize(function(){
    if (resizeTimeout) {
        // clear existing timeout
        clearTimeout(resizeTimeout);
    }
    // set timeout to debounce resize
    resizeTimeout = setTimeout(function () {
//        console.log("Render");
        renderDashboard();
    }, 50); // render after 50ms of inactivity after resize
});
