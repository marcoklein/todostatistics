/* global _ */

/**
 * Holds all data processors.
 * 
 * A data processor is used to process data before it is rendered by a chart.
 */

var DataProcessors = [
    
    {
        name: "completed-items-per-active-project",
        description: "Counts how many completed items each active project has.",
        process: function (data) {
            if (!data.completed) {
                return null;
            }

            var completedItems = data.completed.items;
            var projects = data.sync.projects;

            // process data
            var processedData = _.map(projects, function (project) {

                return {

                    project: project,
                    item_count: _.filter(completedItems, function (item) {
                        return "" + item.project_id === "" + project.id;
                    }).length


                };

            });
            
            // form:
            // [{project: {... project ...}, item_count: 200}, ...]

            return processedData;

        }
    }
    
    
    
];


var dataProcessManager = new DataProcessManager();
dataProcessManager.addAll(DataProcessors);