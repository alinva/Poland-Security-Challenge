angular.module('appname.services', [])
    .factory('ulhttp', function ($http, toastr) {
        return {
            handleError: function (result) {
                result = result.data;
                if (result.status !== 'OK') {
                   // toastr.error(result.message);
                }
                return result;
            },
            post: function (url, data) {
                return $http.post(url, data);
            },
            get: function (url, data) {
                return $http.get(url, data);
            }
        };
    })

    .factory('logginService', function (ulhttp) {
        return {
            loggin: function (email, password) {
                var url = "/api/login";
                var data = {
                    email: email,
                    password: password
                };
                return ulhttp.post(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            }
        };
    })
    .factory('logoutService', function (ulhttp, $rootScope, toastr, $location) {
        return {
            logout: function (email, password) {
                var url = "/api/logout";
                ulhttp.get(url).then(function (result) {
                    if (result.data.status === 'OK') {
                        toastr.success('Logged Out');
                        $location.path('/login');
                    } else {
                        toastr.error('Something went wrong');
                    }
                });
            },
            logoutTimesUp: function (data) {
                var url = "/api/logoutTimesUp";
                ulhttp.post(url,data).then(function (result) {
                    if (result.data.status === 'OK') {
                        toastr.success('Logged Out');
                        $location.path('/signup');
                    } else {
                        toastr.error('Something went wrong');
                    }
                });

            }
        };
    })
    .factory('signupService', function (ulhttp) {
        return {
            signup: function (data) {
                var url = "/api/signup";
                return ulhttp.post(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            }
        };
    })
    .factory('chatService', function (ulhttp) {
        return{
            say: function(data){
            var url = "/api/say";
            return ulhttp.post(url,data).then(function (result) {
            result = ulhttp.handleError(result);
            return result;
            })
            },
            getAllMassages: function(data){
                var url = "/api/getAllMassages";
                return ulhttp.post(url,data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                })
            },
            changeTrafficLight: function(data){
                var url = "/api/changeTrafficLight";
                return ulhttp.post(url,data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                })
            }
        };
    })
    .factory('level1Service', function (ulhttp,$rootScope) {
        return {
            submitPin: function (data) {
                var url = "/api/submitPin";
                return ulhttp.post(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            },
        };

    })
    .factory('level3Service', function (ulhttp) {
        return {
            submitLicensePlate: function (data) {
                var url = "/api/submitLicensePlate";
                return ulhttp.post(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            }
        };

    })
   .factory('profileService', function (ulhttp) {
        return {
            getUserInfo: function (data) {
                var url = "/api/getuserinfo";
                return ulhttp.get(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            },
            getHint: function (data) {
                var url = "/api/getHint";
                return ulhttp.get(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            },
            // Align the clocks + get user info
            getUserClock: function (data) {
                var url = "/api/clock";
                return ulhttp.get(url, data).then(function (result) {
                    result = ulhttp.handleError(result);
                    return result;
                });
            }
        };
    })
    .service('WebSocketService', ['$rootScope', '$q', '$timeout', function ($rootScope, $q, $timeout) {
        var url = window.location.origin.replace("http", "ws");
        var ws = new WebSocket(url);
        var loginPromise;

        // register for desired websocket events:

        ws.onopen = function () {
            $rootScope.$emit("ws:open");
        };

        ws.onmessage = function (e) {
            var data = JSON.parse(e.data);
            $rootScope.$emit("ws:" + data.type, data);
        };

        // WebSocketService API

        this.login = function login(loginData) {
            if (loginPromise) {
                return loginPromise;
            }

            var deferred = $q.defer(),
                isDone;

            if (loginData) {
                this.send('login', loginData);
                var removeListener = $rootScope.$on('ws:login', function(e, data) {
                    // First, remove listener
                    removeListener();
                    if (!isDone) {
                        isDone = true;
                        deferred.resolve(data);
                    }
                });
                $timeout(function () {
                    if (!isDone) {
                        isDone = true;
                        deferred.reject("TIMEOUT");
                    }
                }, 5000); // 5sec timeout
            } else {
                deferred.reject("BAD_ARGS");
            }

            loginPromise = deferred.promise;
            loginPromise.finally(function () {
                loginPromise = null;
            });

            return loginPromise;
        };

        this.send = function (type, data) {
            if (this.isConnected()) {
                ws.send(JSON.stringify({type: type, data: data}));
            }
        };

        this.isConnected = function () {
            return ws && ws.readyState === WebSocket.OPEN;
        };

    }]);