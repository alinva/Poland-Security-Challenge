// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/user');

module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                User.findOne({'local.email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, 'No user found.');

                    if (!user.validPassword(password))
                        return done(null, false, 'Oops! Wrong password.');

                    // all is well, return user
                    else
                        return done(null, user);
                });
            });

        }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                // if the user is not already logged in:
                if (!req.user) {
                    // check to see if theres already a user with that email
                      User.findOne({'local.email': email}, function (err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // check to see if theres already a user with that email
                        if (user) {
                            return done(null, false, 'That email is already taken.');
                        }
                          // check to see if there is a user with role player that has the same course
                        if(!user) {
                            //check course
                            User.find({$and: [{"local.course": req.body.course}, {"local.role": "498e40ad1a2c"}]}, function (err, users) {
                                if (err)
                                    return done(err);

                                // check to see if theres already a users with this course
                                if (users.length !== 0) {
                                    return done(err, false, 'This course is already taken.');
                                }


                                // create the user
                                var newUser = new User();

                                newUser.local.email = email;
                                newUser.local.password = newUser.generateHash(password);
                                newUser.firstName = req.body.firstName;
                                newUser.lastName = req.body.lastName;
                                newUser.local.pin = newUser.createNewPinCode();
                                newUser.local.course = req.body.course;

                                newUser.save(function (err) {
                                    if (err)
                                        return done(err, false, 'Something Went Wrong');

                                    return done(null, newUser);
                                });
                                var query = {$and: [{"local.course": req.body.course}, {"local.role": "78864cbd11"}]}; // find admin role for this course number

                                User.findOne(query, function (err, obj) {
                                    if (!err) {
                                        if (obj) {
                                            obj.local.userAssigndByEmail = newUser.local.email;
                                            obj.save(function (err) {
                                                if (err) {
                                                    return done(err, false, 'Something Went Wrong');
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        return done(err, false, 'Something Went Wrong');
                                    }
                                });
                            });
                        }

                    });
                    // if the user is logged in but has no local account...
                } else if (!req.user.local.email) {
                    // ...presumably they're trying to connect a local account
                    // BUT let's check if the email used to connect a local account is being used by another user
                    User.findOne({'local.email': email}, function (err, user) {
                        if (err)
                            return done(err);

                        if (user) {
                            return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                            // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                        } else {
                            var user = req.user;
                            user.local.email = email;
                            user.local.password = user.generateHash(password);
                            user.firstName = req.body.firstName;
                            user.lastName = req.body.lastName;

                            user.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }
                    });
                } else {
                    // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                    return done(null, req.user);
                }

            });

        }));
};
