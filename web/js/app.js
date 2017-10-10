angular.module('summerproject', ['ngRoute', 'ngResource', 'appname.services', 'appname.controllers', 'ngAnimate', 'toastr', 'RouteData']).
    config(['$routeProvider', 'RouteDataProvider', function ($routeProvider, RouteDataProvider) {
        'use strict';

    RouteDataProvider.applyConfig({
        bodyStyle: {
            'background-image': 'url("../img/Backgrounds/B1.png")'
        }
    });

     RouteDataProvider.hookeToRootScope(true);

    $routeProvider.
            when('/login', {
                title: 'Home',
                templateUrl: 'partials/login.html',
                controller: 'tempCtrl',
                resolve: {loginRedirect: loginRedirect},
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/B1.jpg")'
                    }
                }
            })
            .when('/signup', {
                title: 'Signup',
                templateUrl: 'partials/signup.html',
                controller: 'signupCtrl',
                resolve: {loginRedirect: loginRedirect},
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/B1.jpg")'
                    }
                }
            })
            .when('/final', {
                title: 'final',
                templateUrl: 'partials/final.html',
                controller: 'finalCtrl',
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/B1.jpg")'
                    }
                },
                resolve: {logincheck: checkLogin, loginRedirect: loginRedirect}
            })
            .when('/about', {
                title: 'About',
                templateUrl: 'partials/about.html',
                controller: 'aboutCtrl',
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/B1.jpg")'
                    }
                }
            })
            .when('/help', {
                title: 'Help',
                templateUrl: 'partials/help.html',
                controller: 'helpCtrl',
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/B1.jpg")'
                    }
                }
            })
            .when('/level1', {
            title: 'Level1',
            templateUrl: 'partials/level1.html',
            controller: 'level1Ctrl',
            RouteData: {
                bodyStyle: {
                    'background-image': 'url("../img/Backgrounds/L1.jpg")',
                    }
                },
            resolve: {logincheck: checkLogin, loginRedirect: loginRedirect}   //TODO: SHOULD BE COMMENTED OUT IN DEV - uncomment when finish dev
            })
            .when('/level2', {
                title: 'level2',
                templateUrl: 'partials/level2.html',
                controller: 'level2Ctrl',
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/L2.jpg")'
                    }
                },
                resolve: {logincheck: checkLogin, loginRedirect: loginRedirect}   //TODO: SHOULD BE COMMENTED OUT IN DEV - uncomment when finish dev
            })
            .when('/level3', {
                title: 'Level 3',
                templateUrl: 'partials/level3.html',
                controller: 'level3Ctrl',
                RouteData: {
                    bodyStyle: {
                        'background-image': 'url("../img/Backgrounds/L3.jpg")'
                    }
                },
                resolve: {logincheck: checkLogin, loginRedirect: loginRedirect}   //TODO: SHOULD BE COMMENTED OUT IN DEV - uncomment when finish dev
            })
            .otherwise({redirectTo: '/signup'});
    }]).
    run(['$rootScope', '$q', '$http', function ($rootScope, $q, $http) {
        var loginSetIntialData = function () {
            $http.get('/api/loggedin').success(function (user) {
                if (user != 0) {
                    $rootScope.currentUser = user;
                }
                //User is not Authenticated
                else {
                    $rootScope.currentUser = undefined;
                }
            }).error(function (result) {
                $rootScope.currentUser = undefined;
            });
        }();

    }]);

var checkLogin = function ($q, $http, $location, $rootScope, toastr) {
    var deffered = $q.defer();

    $http.get('/api/loggedin').success(function (user) {
        //User is authenticated
        if (user != 0) {
            $rootScope.currentUser = user;
            deffered.resolve();
        }
        //User is not Authenticated
        else {
            $rootScope.currentUser = undefined;
            deffered.reject();
            $location.url('/login');
            toastr.error('Please Login First');
        }
    }).error(function (result) {
        $location.url('/login');
    });

};

var loginRedirect = function ($q, $http, $location, $rootScope, WebSocketService) {
    var deffered = $q.defer();
    $http.get('/api/loggedin').success(function (user) {
        //User is authenticated
        if (user != 0) {
            $rootScope.currentUser = user;
            WebSocketService.login(user).then(function () {});
            if(user.game.level === 1)
                $location.url('/level1');
            if(user.game.level === 2)
                $location.url('/level2');
            if(user.game.level === 3)
                $location.url('/level3');
            if(user.game.level === 4)
                $location.url('/final');
            deffered.reject();
        }
        //User is not Authenticated
        else {
            $rootScope.currentUser = undefined;
            deffered.resolve();
        }
    })
};


	