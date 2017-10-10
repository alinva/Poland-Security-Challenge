module.exports = function (app, passport) {
    const user = require('../app/models/user');
    var http = require('http');
    var Chat = require('./models/Chat').Chat;
    const Massage = require('./models/Massage');
    var Crypter = require('cryptr'),
        cryptr = new Crypter("305810343");
    var DEBUG = true;
    // var nodemailer = require ('nodemailer');

    var path = require('canonical-path');
    var fs = require("fs");

    var chat = new Chat();
    const Mailer = require('./models/Mailer').Mailer;
    var TIME_PLAY_IN_MINUTES = 25;
    const mailer = new Mailer();
    var Hints = {
        '1': ['Hint 1: Enter a 4 digit pin code and submit using *.', 'Hint 2: Do you see any difference between the digits?', 'Hint 3: You can use brute-force attack.', 'Hint 4: Script example: for(...) { $.post( "...", { pin: ...} ); } '],
        '2': ['Hint 1: The admin’s site is refreshed every 5 seconds.', 'Hint 2: Press the green button.', 'Hint 3: Can you inject a code to admin’s site?', 'Hint 4: https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)'],
        '3': ['Hint 1: Check the network when submitting the plate number.', 'Hint 2: Can you edit the plate number sent to the server?', 'Hint 3: https://www.owasp.org/index.php/Path_Traversal', 'Hint 4: Look for a valid plate number in the "archive" folder.']
    };

    var Flag = ['Level 2: Jaime', 'Level 3: Cercei', 'Level 3: Tyrion'];

    app.get('/api/logout', function (req, res) {
        req.logout();
        res.json(200, {
            status: 'OK',
            message: 'Logged Out'
        });
    });
    // LOGOUT ==============================
    app.post('/api/logoutTimesUp', (req, res) => {
        user.findOne({_id: req.body.id}, function (error, foundUser) {
            if (foundUser) {
                req.logout();
                res.json(200, {
                    status: 'OK',
                    message: 'Logged Out'

                });
            }
            else {
                responseWrapper(response, res, 'ERROR', 'Shit just got real ! couldn\'t find user');
            }

        });
    });

    // =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // process the login form
    app.post('/api/login', function handleLocalAuthentication(req, res, next) {//Utilizing custom callback to send json objects
        passport.authenticate('local-login', function (err, user, message) {
            if (err) {
                return next(err);
            }
            var response = {};
            if (!user) {
                response.status = 'ERROR';
                response.message = message;
                return res.json(200, response);
            }
            if (new Date(user.game.timeEnd) - new Date() <= 0) { //time ended
                response.status = 'TIMEEND';
                response.message = " Time is UP!";
                return res.json(200, response);
            }
            // Manually establish the session...
            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }
                response.status = 'OK';
                response.user = user;

                return res.json(200, response);
            });

        })(req, res, next);
    });


    app.post('/api/signup', function handleLocalAuthentication(req, res, next) { //Utilizing custom callback to send json objects
        passport.authenticate('local-signup', function (err, user, message) {
            if (err) {
                return next(err);
            }
            var response = {};
            if (!user) {
                response.status = 'ERROR';
                response.message = message;
                return res.json(200, response);
            }
            // Manually establish the session...
            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }
                response.status = 'OK';
                response.user = user;

                // send counter plus one
                initUserGameClock(user);
                return res.json(200, response);
            });
        })(req, res, next);
    });

    app.get('/api/loggedin', function (req, res) {
        res.send(req.isAuthenticated() ? removeSensitiveInfo(req.user) : '0');
    });


    app.get('/api/getuserinfo', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (user) {
                response.status = 'OK';
                response.user = removeSensitiveInfo(user);
                res.json(200, response);
            } else {
                response.status = 'ERROR';
                response.message = 'Something Went Wrong';
                res.json(200, response);
            }
        });
    });

    app.get('/api/gettimeinfo', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (user) {
                response.status = 'OK';
                response.user = removeSensitiveInfo(user);
                res.json(200, response);
            } else {
                response.status = 'ERROR';
                response.message = 'Something Went Wrong';
                res.json(200, response);
            }
        });
    });

    app.post('/api/submitPin', isLoggedIn, function (req, res, next) {
        if (req.user && req.user.game.level > 1) {
            var response = {};
            return responseWrapper(response, res, 'ERROR', 'Already done');
        }
        next();
    }, function (req, res) {
        var user_id = req.user._id.toString();
        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something went wrong - no user found');
                return;
            }
            var isRight = checkPin(req.body.pin, user);
            if (isRight) {
                setUserLevel(user);
                process.nextTick(function () {
                    app.eventBus.emit("submitPin", removeSensitiveInfo(user));
                });

                responseWrapper(response, res, 'OK', 'Good answer');
            } else {
                var message = 'Wrong answer';
                responseWrapper(response, res, 'ERROR', message);
            }
        });
    });

    app.post('/api/submitLicensePlate', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();
        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var parking_unauthorized_ui_message = "Not Authorized! the license plate is not approved anymore, for this date. ";
            var parking_authorized_ui_message = "Parking approved!";
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something went wrong - no user found');
                return;
            }

            if (user.game.level != 3) {
                responseWrapper(response, res, 'ERROR', "not authorized for this API in this level", undefined, "not authorized for this API in this level");
                return;
            }

            var fileName = "app/parking_access/license_plates/2017/03/" + req.body.licensePlate;
            var normalizedFileName = path.normalize(fileName);
            console.log("Check License Plate - licensePlate = " + req.body.licensePlate + ", normalizedFileName = " + normalizedFileName + ", level = " + user.game.level);
            if (!normalizedFileName.startsWith("app/parking_access/")) { // Try to access above parking_access folder
                var message = "Nice try :) Access denied"; //Access to parking lot denied
                console.log("Check License Plate - Access denied. " + message);
                responseWrapper(response, res, 'ERROR', parking_unauthorized_ui_message, undefined, message);
            }
            else {
                // var fileNameForMessage = normalizedFileName.split("parking_access/")[1]; // File name relative to app/parking_access/
                fs.exists(normalizedFileName, function (exists) {
                    if (exists) {
                        if (fs.lstatSync(normalizedFileName).isDirectory()) {

                            if ((normalizedFileName.slice(-1)) != "/") {    //if directory sent without a '/' at end, readdir will fail- so add it.
                                normalizedFileName = normalizedFileName.concat("/");
                            }

                            var message = "File " + normalizedFileName + " is a directory and not a file. Parking not authorized.\n";
                            message += "DEBUG message: folder content of " + normalizedFileName + " :\n";

                            fs.readdir(normalizedFileName, function (err, files) {
                                for (var i = 0; i < files.length; i++) {
                                    if (fs.lstatSync(normalizedFileName + files[i]).isDirectory()) {
                                        message += files[i] + "/ ";
                                    } else {
                                        if (files[i].startsWith(".keep"))
                                            continue;
                                        message += files[i] + " ";
                                    }
                                }
                                console.log("Check License Plate - Access denied. \n" + message);
                                responseWrapper(response, res, 'ERROR', parking_unauthorized_ui_message, undefined, message);
                            });
                        } else {
                            if (normalizedFileName.startsWith("app/parking_access/license_plates/archive_10_years/")) {
                                // File found - access approved !!!
                                var message = "Congratulations!!! File " + normalizedFileName + " found, Parking approved";

                                setUserLevel(user);

                                console.log("Check License Plate - Good answer. " + message);
                                responseWrapper(response, res, 'OK', parking_authorized_ui_message, undefined, message);
                            }
                            else {
                                var message = " Parking not authorized for file " + normalizedFileName;
                                console.log("Check License Plate  - Access denied." + message);
                                responseWrapper(response, res, 'ERROR', parking_unauthorized_ui_message, undefined, message);

                            }
                        }
                    }
                    else {
                        // File does not exist
                        var message = "File " + normalizedFileName + " does not exist. Parking not authorized.";
                        console.log("Check License Plate - Access denied. " + message);
                        responseWrapper(response, res, 'ERROR', parking_unauthorized_ui_message, undefined, message);
                    }
                });
            }
        });
    });

    // =============================================================================
    // For Leaderboard =============================================================
    // =============================================================================

    app.get('/api/users', function (req, res) {
        user.find({}, function (err, users) {
            var userMap = {};

            users.forEach(function (user) {
                userMap[user._id] = removeSensitiveInfo(user);
            });

            var response = {};
            response.status = 'OK';
            var byScore = users.slice(0);
            byScore.sort(function (a, b) {
                return b.game.score - a.game.score;
            });

            response.users = byScore;
            res.json(200, response);
        });
    });

    function removeSensitiveInfo(user) {
        if (user) {
            user._doc.game.hints = undefined;
            user._doc.game.question = undefined;
            user.local.pin = undefined;
            user.local.password = undefined;
        }
        return user;
    }

    // =============================================================================
    // Game ROUTES =================================================================
    // =============================================================================
    app.get('/api/game', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();

        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found', user);
                return;
            }
            setGameLevelDetails(user);
            if (user.game && user.game.timeEnd && (user.game.timeEnd - new Date() < 0)) {
                responseWrapper(response, res, 'ERROR', 'Times up!', user);
            } else {
                responseWrapper(response, res, 'OK', 'Game Details Returned', user);
            }
        });
    });

    app.get('/api/clock', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();

        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found', user);
                return;
            }
            setGameLevelDetails(user);
            if (user.game && user.game.timeEnd && (user.game.timeEnd - new Date() < 0)) {
                responseWrapper(response, res, 'ERROR', 'Times up!', user);
            } else {
                responseWrapper(response, res, 'OK', 'Game Details Returned', user);
            }
        });
    });

    app.get('/api/submitAnswer', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();

        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something went wrong - no user found');
                return;
            }
            var isRight = (req.query) && checkAnswer(req.query.answer, req.cookies, user.game.level, user);

            response.user = user;
            if (isRight) {
                // Reached level 5:
                if (user.game.level === 5) {
                    // Set cookie for level 5
                    res.cookie('isAdmin', 'false');
                }
                // Reached level 6:
                if (user.game.level === 6) {
                    // Clear cookie for level 6
                    res.clearCookie('isAdmin');
                }
                responseWrapper(response, res, 'OK', 'Good answer', user);
            } else {
                var message = 'Wrong answer';
                if (user.game.level === 5) {
                    message = 'Access denied! Only administrators can delete the log';
                }
                responseWrapper(response, res, 'ERROR', message, user);
            }
        });
    });

    app.get('/api/getHint', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();

        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
                return;
            }
            setHint(user);
            setGameLevelDetails(user);

            user.save();
            response.user = user;
            responseWrapper(response, res, 'OK', 'Game Hints Returned', user);
        });
    });
    app.post('/api/changeTrafficLight', isLoggedIn, function (req, res) {
        var user_id = req.user._id.toString();
        // Find user:
        user.findOne({_id: user_id}, function (error, user) {
            var response = {};
            if (user) {
                if (user.game.level === 2) {
                    if (true)
                        responseWrapperError(response, res, '401', '401 - Not authorized', true,200);
                }
                else {
                    responseWrapper(response, res, 'ERROR', 'Something Went Wrong - user  is not on level 2');
                    return;
                }
            }
            else {
                responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
                return;
            }
        });
    });

    app.post('/api/getAllMassages', function (req, res) {
        var response = {};
        if(req.user) {
            //initial messages
            var user_id = req.user._id.toString();
            var loggedUser = req.user;
            var email = req.user.local.email;

            user.findOne({"_id": user_id}, function (error, foundUser) {
                if (error) {
                    responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
                    return;
                }
                if(foundUser && foundUser.local.isFirst === 0)
                {
                    var massage1 = new Massage();
                    massage1.massage = "Hi, Admin. I am getting a heavy traffic in junction 334";
                    massage1.author = "Edgar";
                    massage1.playerID = foundUser.local.email;

                    var massage2 = new Massage();
                    massage2.massage = "Hi, please change also the Left turn time interval, it's creating a jam.";
                    massage2.author = "Allan Poe";
                    massage2.playerID = foundUser.local.email;

                    var massage3 = new Massage();
                    massage3.massage = "OK, Problem solved, new time intervals were deployed .\nThanks for the report. ";
                    massage3.author = "Administrator";
                    massage3.playerID = foundUser.local.email;

                    chat.say(massage1);
                    chat.say(massage2);
                    chat.say(massage3);
                    foundUser.local.isFirst = 1;
                    foundUser.save();

                    response.Messages = {massage1, massage2, massage3}
                    responseWrapper(response, res, 'ERROR', 'Initial messages were sent.');
                }
                else
                {
                    responseWrapper(response, res, 'ERROR', 'Initial messages were sent before.');
                }
            });

                chat.getAllMassages(user_id, email, function (result) {
                        response.allMassages = result;

                        var responseMessages = response;

                        var statusResult = {status: 'OK', message: 'All massages sent', contentType: "text/html"}
                        var dataInfo = {};
                        dataInfo.allMassages = result;
                        dataInfo.result = statusResult;

                    if(loggedUser.game.level === 2) {
                        let scriptArr = [
                            "<script>turnGreenLightOn()</script>",
                            "<script>turnGreenLightOn</script>",
                            "<script>$('#adminButton').click()</script>",
                            "<script>$('.greenLightButton').click()</script>",
                            "<script>$('.greenLightButton')[0].click()</script>",
                            "<script>document.getElementById('adminButton').click()</script>",
                            "<script>document.getElementsByClassName('greenLightButton')[0].click()</script>",
                            "<script>angular.element(document.querySelector('#adminButton')).click()</script>",
                            "<script>turnGreenLightOn()",
                            "<script>turnGreenLightOn",
                            "<script>$('#adminButton').click()",
                            "<script>$('.greenLightButton').click()",
                            "<script>$('.greenLightButton')[0].click()",
                            "<script>document.getElementById('adminButton').click()",
                            "<script>document.getElementsByClassName('greenLightButton')[0].click()",
                            "<script>angular.element(document.querySelector('#adminButton')).click()",
                            "<img src= a onerror=turnGreenLightOn()>",
                            "<img src= a onerror=turnGreenLightOn>",
                            "<img src= a onerror=$('#adminButton').click()>",
                            "<img src= a onerror=$('.greenLightButton').click()>",
                            "<img src= a onerror=$('.greenLightButton')[0].click()>",
                            "<img src= a onerror=document.getElementById('adminButton').click()>",
                            "<img src= a onerror=document.getElementsByClassName('greenLightButton')[0].click()>",
                            "<img src= a onerror=angular.element(document.querySelector('#adminButton')).click()>",
                        ];
                        result.forEach(function (element) {
                            let string = element._doc.massage;
                            string = string.replace(";", "").replace(/"/g, '\'').replace(/^\s\n+|\s\n+$/g,'');
                            for (var i=0 ; i < scriptArr.length ; i++) {
                                if (string === scriptArr[i]) {
                                    var message = "XSS successful !!";
                                    responseWrapper(response, res, 'OK', "XSS successful !!!", undefined, message);
                                    setUserLevel(loggedUser);
                                    return;
                                }
                            }
                        });
                        process.nextTick(function () {
                            dataInfo.user = removeSensitiveInfo(loggedUser);
                            app.eventBus.emit("getChatMessages", dataInfo);

                        });
                    }
                    else
                    {
                        responseWrapper(response, res, 'ERROR', 'Something Went Wrong - user  is not on level 2.');
                    }
                });
        }
        else {
            responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
        }

    });

    app.post('/api/say', function (req, res) {
        var user_id = req.user._id.toString();

        // Find user:
        user.findOne({ _id: user_id }, function (error, user) {
            var response = {};
            if (error) {
                responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
                return;
            }
            else {
                // var chat = new Chat();
                chat.say(new Massage(
                    {
                        massage: req.body.content,
                        author: req.body.author,
                        playerID: req.body.playerID,
                    }));
                responseWrapper(response, res, 'OK', 'Massage was sent', removeSensitiveInfo(user));
            }
        });


    });

        app.get('/api/reset', function (req, res) {
        var id = req.query.id
        var email = req.query.email
        if (id == "3058") {
            user.findOne({"local.email": email}, function (error, user) {
                var response = {};
                if (error) {
                    responseWrapper(response, res, 'ERROR', 'Something Went Wrong - no user found');
                    return;
                }
                if (user) {

                    user.local.password = user.generateHash("1234");
                    user.save();
                    fs.readFile("./web/partials/ok.html", function (err, html) {
                        if (!err) {
                            res.write(html)
                            // responseWrapper(response, res, 'OK', 'DataBase initialized', "All was set to your liking, master!");

                        }
                    });
                }
                else {
                    responseWrapper(response, res, 'Error', 'DataBase not initialized', "User WAS NOT FOUND!! ==============================================");
                }
            });
        }
        else
        {
            responseWrapper(response, res, 'Error', 'DataBase not initialized', "id is now correct");
        }
    });

    //++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++   Helpers    ++++++++++++++++
    //++++++++++++++++++++++++++++++++++++++++++++++++++

    function setGameLevelDetails(user) {
        // init questions, hints and clock:
        if (user.game === undefined || user.game.timeEnd === undefined) {
            initUserGameClock(user);
        }
    }

    function setHint(user) {
        var allHints = Hints[user.game.level];
        var usedHints = user.game.hints;
    if(user.game.level <4){
        if (usedHints.length < allHints.length) {
            // Set the additional hint
            usedHints.push(allHints[usedHints.length]);
            if(user.game.hintsNum <= 8)
                user.game.hintsNum++;
        }
        // Set hints status
        if (usedHints.length < allHints.length) {
            user.game.hasMoreHints = true;
        } else {
            user.game.hasMoreHints = false;
        }
    }
    }

    function initUserGameClock(user) {
        user.game = {
            level: 1,
            score: 0,
            timeEnd: new Date(new Date().getTime() + TIME_PLAY_IN_MINUTES * 60000),
            timeStart: new Date(),
            hints: [],
            hasMoreHints: true,
            question: ''
        };
        user.save();
        return;
    }

    function checkPin(answer, user) {
        var isCorrect = false;
        if ( (user) ) {
            if (user.game.level === 1) {
                var pinCode = user.local.pin;
                if (answer) {
                    isCorrect = (pinCode === cryptr.encrypt(answer));
                }
            }
        }
        return isCorrect;
    }

    function setUserScoreAndLevel(user) {
        user.game.level = user.game.level + 1;

        // set score:
        var diffMs = (user.game.timeEnd - new Date());
        var diffMins = diffMs < 0 ? 0 : Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        var scoreFactor = LevelScore[user.game.level];
        scoreFactor = Number.isInteger(scoreFactor) ? scoreFactor : 0;

        // Hint factor
        var hintFactor = 1;
        if (user.game.hints.length > 0) {
            hintFactor = 1 - ((user.game.hints.length + 1) * 0.1);
        }
        user.game.score += diffMins * scoreFactor * hintFactor;
        user.game.score = Math.round(user.game.score);

        // Clear hints for next level
        user.game.hints = [];
        user.game.hasMoreHints = true;

        // if user finished the game, we set the time:
        if (user.game.level == 4) {
            user.game.timeUserFinished = new Date();
        }
        // save:
        user.save();
    }

    function setUserLevel(user) {
        user.game.level = user.game.level + 1;

        // set score:
        var diffMs = (user.game.timeEnd - new Date());

        // Clear hints for next level
        user.game.hints = [];
        user.game.hasMoreHints = true;

        // if user finished the game, we set the time:
        if (user.game.level == 4) {
            user.game.timeUserFinished = new Date();
            if(!DEBUG) {
                let massage='';
                for (let i=0; i<user.game.level-2; i++)
                {
                    massage= massage+ 'Level '+i+1+ ' passed. Your flag is: ' +  Flag[i] + '\n';
                }
            }
        }

        // save:
        user.save();
    }

}

//After Leve1 ..

// =============================================================================
// Helpers =====================================================================
// =============================================================================

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.send('you are not logged in');
    }
}

/**
 *
 * @param response
 * @param res
 * @param status
 * @param message
 * @param user
 * @param log - (optional) additional data returned to the client
 */
function responseWrapper(response, res, status, message, user, log) {
    response.user = user;
    response.status = status;
    response.message = message;
    response.log = log;
    response.contentType = "text/html"
    res.json(200, response);

}
function responseWrapperError(response, res, status, message, user, errorNum, log) {
    response.user = user;
    response.status = status;
    response.message = message;
    response.log = log;
    res.json(errorNum, response);
}
