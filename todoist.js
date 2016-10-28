/**
 * 
 * Todoist API.
 * 
 */

var request = require("request");
var Promise = require("promise");
var _ = require("underscore");

/**
 * 
 * @param {string} token API access token of the user. 
 */
var TodoistAPI = function (token) {
    this.token = token;
    this.completed.token = token;
    this.activity.token = token;
};

/**
 * Makes a sync call to the Todoist API.
 * 
 * Returns a Promise.
 * 
 * @param {type} resource_types
 * @returns {nm$_todoist.TodoistAPI.prototype.sync.promise|nm$_todoist.TodoistAPI.prototype.sync.promise.syncPromise|Object.prototype.sync.promise}
 */
TodoistAPI.prototype.sync = function sync(resource_types) {
    
    if (!resource_types) {
        // use all if no resource type is specified
        resource_types = "[all]";
    }
    
    // message:
    // token
    // sync_token
    // resource_types
    // [day_orders_timestamp]
    var self = this;
    var promise = new Promise(function syncPromise(resolve, reject) {
        
        var token = self.token;
        
        console.log("TodoistAPI: Sending sync request with token: " + token);

        var tokenParams = "?";
        tokenParams += "token=" + token;
        tokenParams += "&";
        tokenParams += "sync_token=*";
        tokenParams += "&";
        tokenParams += "resource_types=" + "[\"all\"]";

        request.get("https://todoist.com/API/v7/sync" + tokenParams,
                function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        resolve(JSON.parse(body));
                        console.log("Resolved.");
                    } else {
                        reject(error);
                        console.log("Rejected: " + JSON.stringify(response));
                    }
                }
        );
    });

    return promise;
};

TodoistAPI.prototype.completed = {
    /**
     * Returns all completed items. Provided options are optional.
     * 
     * This method may take some time because it can only retrieve 50 items per
     * request. Requests are sent until no more items are retrieved.
     * 
     * @param {type} options See https://developer.todoist.com/?shell#get-all-completed-items for complete reference.
     * @returns {Promise} 
     */
    get_all: function get_all(options) {
        var self = this;


        var userOptions = null;
        if (options) {
            // attach options
            _.each(Object.keys(options), function (option) {
                options += "&";
                options += option;
                options += "=";
                options += options[option];
            });
        }
        
        /**
         * Called recursively to get all completed items.
         * 
         * @param {type} token
         * @param {type} offset
         * @param {type} msgBody Holds items and projects see Todoist developer doc.
         * @param {type} callback
         * @returns {undefined}
         */
        function getNextCompletedItems(token, offset, msgBody, callback) {

            var tokenParams = "?";
            tokenParams += "token=" + token;
            tokenParams += "&";
            tokenParams += "limit=50";
            tokenParams += "&";
            tokenParams += "offset=" + offset;
            // add user options if defined
            if (userOptions) {
                tokenParams += userOptions;
            }

//    console.log("Retrieving completed items with params: " + tokenParams);

            request.get("https://todoist.com/API/v7/completed/get_all" + tokenParams,
                    function (error, response, body) {
                        if (error) {
                            console.error("ERROR: Could not retrieve completed items: " + response);
                            return;
                        }
                        // parse body
                        body = JSON.parse(body);
                        
                        // add all projects which are not already added
                        msgBody.projects = _.union(msgBody.projects, body.projects);

                        // get body items
                        var items = body.items;
                        console.log("Retrieved " + items.length + " items.");
                        
                        // add items to all body
                        for (var i = 0; i < items.length; i++) {
                            msgBody.items.push(items[i]);
                        }


                        if (items.length === 50) {
                            // make another request until no more item can be retrieved
                            getNextCompletedItems(token, offset + 50, msgBody, function (msgBody) {
                                callback(msgBody);
                            });
                        } else {
                            // all items retrieved
                            msgBody.projects = body.projects;
                            console.log((msgBody.items.length) + " items recieved.");
                            callback(msgBody);
                        }
                    }
            );
        };
        
        
        var promise = new Promise(function getAllCompletedPromise(resolve, reject) {
            console.log("Get all request with token: " + self.token);
            getNextCompletedItems(self.token, 0, { items: [], projects: []}, function (msgBody) {
                
                //console.log("all items: " + JSON.stringify(allItems));

                if (msgBody) {
                    resolve(msgBody);
                } else {
                    reject("Could not retrieve all completed items.");
                }
            });
            
            
        });


        return promise;
    }
};


TodoistAPI.prototype.activity = {
    /**
     * Requests and returns the activity. Provided options are optional.
     * 
     * This method may take some time because it can only retrieve 100 items per
     * request. Requests are sent until no more items are retrieved.
     * 
     * @param {type} options See https://developer.todoist.com/?shell#get-activity-logs for complete reference.
     * @returns {Promise} 
     */
    get: function get(options) {
        var self = this;
        
        
        var userOptions = null;
        if (options) {
            // attach options
            _.each(Object.keys(options), function (option) {
                options += "&";
                options += option;
                options += "=";
                options += options[option];
            });
        }
        
        /**
         * Called recursively to get all completed items.
         * 
         * @param {type} token
         * @param {type} offset
         * @param {type} msgBody Holds items and projects see Todoist developer doc.
         * @param {type} callback
         * @returns {undefined}
         */
        function getNextActivityItems(token, offset, msgBody, callback) {

            var tokenParams = "?";
            tokenParams += "token=" + token;
            tokenParams += "&";
            tokenParams += "limit=100";
            tokenParams += "&";
            tokenParams += "offset=" + offset;
            // add user options if defined
            if (userOptions) {
                tokenParams += userOptions;
            }

//    console.log("Retrieving completed items with params: " + tokenParams);

            request.get("https://todoist.com/API/v7/activity/get" + tokenParams,
                    function (error, response, body) {
                        if (error) {
                            console.error("ERROR: Could not retrieve activity items: " + response);
                            return;
                        }
                        // parse body
                        items = JSON.parse(body);
                        console.log("Retrieved " + items.length + " items.");
                        
                        // add items to all body
                        for (var i = 0; i < items.length; i++) {
                            msgBody.items.push(items[i]);
                        }


                        if (items.length === 100) {
                            // make another request until no more item can be retrieved
                            getNextActivityItems(token, offset + 100, msgBody, function (msgBody) {
                                callback(msgBody);
                            });
                        } else {
                            // all items retrieved
                            console.log((msgBody.items.length) + " items recieved.");
                            callback(msgBody);
                        }
                    }
            );
        };
        
        
        var promise = new Promise(function getAllActivityPromise(resolve, reject) {
            console.log("Get all request with token: " + self.token);
            getNextActivityItems(self.token, 0, { items: []}, function (msgBody) {
                
                //console.log("all items: " + JSON.stringify(allItems));

                if (msgBody) {
                    resolve(msgBody);
                } else {
                    reject("Could not retrieve all activity items.");
                }
            });
            
            
        });


        return promise;
    }
};

module.exports = TodoistAPI;