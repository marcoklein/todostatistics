/* global _, ModuleUtils */

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
    },
    {
        name: "postponed-active-items",
        description: "Returns all active items with the number of postpones.",
        process: function (data) {
            if (!data.sync || !data.activity) {
                return null;
            }
            var activity = data.activity.items;


            // filter out all none items
            var itemActivity = _.filter(activity, function (itemFilter) {
                return itemFilter.event_type === "updated" && itemFilter.object_type === "item";
            });

            // compare only active items
            var items = data.sync.items;


            // [{item: {... item ...}, postpone_count: 200}, ...]
            return _.map(items, function (item) {

                var postponedCount = _.filter(itemActivity, function (itemFilter) {
                    if (item.content === itemFilter.extra_data.content) {
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

                return {
                    item: item,
                    postponed_count: postponedCount
                };
            });

        }
    }
    
    
    
];


var dataProcessManager = new DataProcessManager();
dataProcessManager.addAll(DataProcessors);