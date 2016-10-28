

/* global __dirname */

var bodyParser = require("body-parser");
var request = require("request");
var fs = require("fs");

var express = require('express');
var session = require('express-session');
var app = express();

// set up express
app.use(express.static("public"));

// init sessions
app.use(session({ secret: 'ad78192873763487adbf7865f567b4ad7654acd65beefda126353649012098', cookie: { maxAge: 60000 }}));

// set body parser for express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


// extract production flag
var commandLineArgs = require("command-line-args");
var optionDefinitions = [
    { name: "production", alias: "p", type: Boolean }
];
var options = commandLineArgs(optionDefinitions);

if (options.production) {
    console.log("Starting with production mode enabled.");
}

// constants to access Todoist App

var PRODUCTION_DOMAIN = "https://todoiststatistics.marco-klein.com";

var TODOIST_CLIENT_ID = options.production ? "dfe159c316fc4e938f318a09a791e8c8" : "81ec6427a0a349e4934f939df243eb03";
var TODOIST_CLIENT_SECRET = options.production ? "d51db700ba4d4a91ae71b1459325ccc0" : "a42733352c684f01a4505e51a29cb93d";
var TODOIST_SCOPE = "data:read";


var PORT = 3012;



// project libs

var TodoistAPI = require("./todoist.js");

var PersistentCache = require("./persistentCache.js");
var userCache = new PersistentCache("./userCache");

app.get('/', function (req, res) {
    
    console.log("req: " + JSON.stringify(req.body));
    
    // access token is stored session
    var accessToken;
    if (req.session) {
        // retrieve access token if possible
        accessToken  = req.session.access_token;
    } else {
        accessToken = null;
    }
    
    // authorize user if not authorized
    if (!accessToken) {
        
        // user has to press start on landing page
        res.render("landingPage.html");

    } else {
        // user is authorized
        console.log("User is authorized.");
        
        // redirect to home page
        var todoist = new TodoistAPI(accessToken);
        
        
        todoist.sync().then(function (value) {
            console.log("Sync completed: " + value);
            
            console.log("Completed count: " + value.user.completed_count);
            
            // get user id
            var userId = value.user.id;
            
            // store user id in session
            req.session.user_id = userId;
            
            
            userCache.put(userId, "sync", value);
            
            todoist.completed.get_all({
                since: "2016-10-21T12:00"
            }).then(function (value) {
                console.log("Retrieved all completed items for last days.");
            });
            
            
            res.render("index.html", { todoist_data: value, todoist_data_string: JSON.stringify(value) });
        }).catch(function (error) {
            console.error("Token invalid: redirecting user and clearing access token: " + error);
            // could not make sync request
            // -> access token may be invalid
            // -> clear session access token and redirect user to login page
            req.session.access_token = null;
            redirect("/");
        });
    }
});

app.get("/login", function (req, res) {
    var params = "?";
    // add client id
    params += "client_id=" + TODOIST_CLIENT_ID;
    params += "&";
    params += "scope=" + TODOIST_SCOPE;
    params += "&";
    params += "state=" + "secretstring"; // TODO replace state with random string

    // redirect to todoist oauth authorization site
    res.redirect("https://todoist.com/oauth/authorize" + params);
});

// referall url after OAuth authorization
app.get("/oauth", function (req, res) {
    // response contains access code and state
    
    if (req.query.state !== "secretstring") {
        res.send("Authorization failed.");
        console.log("ERROR: State of AOuth Authorization is wrong.");
        return;
    }
    
    // exchange code for access token
    var code = req.query.code;
    
    console.log("OAuth code: " + code);
    
    
    
    var tokenParams = "?";
    tokenParams += "client_id=" + TODOIST_CLIENT_ID;
    tokenParams += "&";
    tokenParams += "client_secret=" + TODOIST_CLIENT_SECRET;
    tokenParams += "&";
    tokenParams += "code=" + code;

    request.post(
            "https://todoist.com/oauth/access_token" + tokenParams,
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    body = JSON.parse(body);
                    var accessToken = body.access_token;
                    var tokenType = body.token_type;
                    
//                    getAllCompletedItems(accessToken);
                    req.session.access_token = accessToken;
                    
//                    if (options.production) {
//                        res.redirect(PRODUCTION_DOMAIN + "/");
//                    } else {
                    res.redirect("/");
//                    }
                } else {
                    console.error("ERROR: " + response.statusCode + " Access token could not be requested: " + error);
                    console.error(JSON.stringify(body));
                    res.send(body);
                }
            }
    );

    
});

app.post("/API/v7/sync", function (req, res) {
    console.log("Sync request with token: " + req.session.access_token);
    if (req.session && req.session.access_token) {

        // test if can return cached data
        userCache.get(req.session.user_id, "sync", function (cachedData, error) {
            if (cachedData) {
                console.log("Returning cached sync data.");
                res.end(JSON.stringify(cachedData));
            } else {
                var todoist = new TodoistAPI(req.session.access_token);

                todoist.sync().then(function (value) {

                    console.log("Sending synced value.");
                    res.end(JSON.stringify(value));

                    userCache.put(req.session.user_id, "sync", value);
                });
            }
        });
    } else {
        console.log("Sync request login refused");
        res.end("You must login first.");
    }
});

app.post("/API/v7/completed/get_all", function (req, res) {
    console.log("Completed get_all request with token " + req.session.access_token);
    
    if (req.session && req.session.access_token) {
        
        // test if can return cached data
        userCache.get(req.session.user_id, "completed", function (cachedData, error) {
            if (cachedData) {
                console.log("Returning cached completed data.");
                res.end(JSON.stringify(cachedData));
            } else {
                var todoist = new TodoistAPI(req.session.access_token);

                todoist.completed.get_all().then(function (value) {

                    userCache.put(req.session.user_id, "completed", value);

                    console.log("Sending completed items.");
                    res.end(JSON.stringify(value));
                }

                ).catch(function (error) {
                    console.log("Error completed items: " + error);
                });
            }
        });
        
    } else {
        console.log("Completed get_all request login refused");
        res.end("You must login first.");
    }
});

app.post("/API/v7/activity/get", function (req, res) {
    console.log("Activity get request with token " + req.session.access_token);
    
    if (req.session && req.session.access_token) {
        
        // test if can return cached data
        userCache.get(req.session.user_id, "activity", function (cachedData, error) {
            if (cachedData) {
                console.log("Returning cached activity log.");
                res.end(JSON.stringify(cachedData));
            } else {
                // query data
                var todoist = new TodoistAPI(req.session.access_token);

                todoist.activity.get().then(function (value) {

                    userCache.put(req.session.user_id, "activity", value);

                    console.log("Sending activity items.");
                    res.end(JSON.stringify(value));

                }).catch(function (error) {
                    console.log("Error activity items: " + error);
                });
            }
        });
        
        
    } else {
        console.log("Activity get_all request login refused");
        res.end("You must login first.");
    }
});



app.listen(PORT, function () {
    console.log("Example app listening on port " + PORT + "!");
});