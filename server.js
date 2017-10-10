var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var configDB = require('./config/database.js');
var http = require('http');
var ws = require('ws');
var EventEmitter = require('events').EventEmitter;
var eventBus = new EventEmitter();
app.eventBus = eventBus;

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));
// required for passport
app.use(session({secret: 'ilovescotchscotchyscotchscotch'})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(express.static(__dirname + '/web'));
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
// launch ======================================================================
console.log('The magic happens on port ' + port);

app.use(function(req, res, next) {
    var e = new Error("Not found");
    e.status = 404;
    next(e);
});

app.use(function(err, req, res, next) {
    err = err || {};
    res.status(err.status || 500);
    res.send(err.message || "Error");
});

var server = app.listen(port, function () {
    console.log("server is up on port:", port);
});

(function () {
    var wsServer = new ws.Server({server: server});
    var sockets = {};
    eventBus.on("submitPin", function (data) {
        console.log("submitPin", data);
        if (data && sockets[data._id]) {
            sockets[data._id].send(JSON.stringify({type: "result", data: data}));
        }
    });
    eventBus.on("getChatMessages", function (data) {
        console.log("getChatMessages", data);
        if (data && data.user && sockets[data.user._id]) {
            sockets[data.user._id].send(JSON.stringify({type: "result2", data: data}));
        }
    });
    wsServer.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
            var data = JSON.parse(message);
            if (data && data.type === "login" && data.data) {
                if (!sockets[data.data._id]) {
                    sockets[data.data._id] = [];
                    sockets[data.data._id].send = function (msg) {
                        this.forEach(function (socket) {
                            console.log("sending message..", msg);
                            socket && socket.readyState === 1 && socket.send(msg);
                        });
                    };
                }
                ws.__id = data.data._id;
                //sockets[data.data._id] = ws;
                sockets[data.data._id].push(ws);
                ws.send(JSON.stringify({type: "login", data: {}}));
            }
        });
    });
})();

