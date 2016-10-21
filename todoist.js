/**
 * 
 * Todoist API.
 * 
 */

var request = require("request");
var RSVP = require("RSVP");

/**
 * 
 * @param {string} token API access token of the user. 
 */
var TodoistAPI = function (token) {
    this.token = token;
    this.completed.token = token;
};

TodoistAPI.prototype.sync = function sync() {
    // message:
    // token
    // sync_token
    // resource_types
    // [day_orders_timestamp]
    var self = this;
    var promise = new RSVP.Promise(function syncPromise(resolve, reject) {
        
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
    get_all: function get_all() {
        var self = this;
        
        

        function getNextCompletedItems(token, offset, allItems, callback) {

            var tokenParams = "?";
            tokenParams += "token=" + token;
            tokenParams += "&";
            tokenParams += "limit=50";
            tokenParams += "&";
            tokenParams += "offset=" + offset;

//    console.log("Retrieving completed items with params: " + tokenParams);

            request.get("https://todoist.com/API/v7/completed/get_all" + tokenParams,
                    function (error, response, body) {
                        if (error) {
                            console.error("ERROR: Could not retrieve completed items: " + response);
                            return;
                        }
                        // parse body
                        var body = JSON.parse(body);

                        var items = body.items;
                        console.log("Retrieved " + items.length + " items.");

                        for (var i = 0; i < items.length; i++) {
                            allItems.push(items[i]);
                        }


                        if (items.length === 50) {
                            // make another request until no more item can be retrieved
                            getNextCompletedItems(token, offset + 50, allItems, function (allItems) {
                                callback(allItems);
                            });
                        } else {
                            // all items retrieved
                            console.log((offset + items.length) + " items recieved.");
                            callback(allItems);
                        }
                    }
            );
        };
        
        
        var promise = new RSVP.Promise(function getAllCompletedPromise(resolve, reject) {
            console.log("Get all request with token: " + self.token);
            getNextCompletedItems(self.token, 0, [], function (allItems) {
                
                console.log("all items: " + JSON.stringify(allItems));

                if (allItems) {
                    resolve(allItems);
                } else {
                    reject("Could not retrieve all completed items.");
                }
            });
            
            
        });


        return promise;
    }
};


module.exports = TodoistAPI;