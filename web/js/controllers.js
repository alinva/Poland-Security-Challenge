angular.module('appname.controllers', ['ngAnimate'])

    .controller('BaseCtrl', ['$scope', 'logoutService','level1Service','profileService','$timeout','toastr','$location', '$rootScope' , function ($scope, logoutService,level1Service, profileService,$timeout,toastr ,$location, $rootScope) {
        $scope.showHints = false;
        $scope.showLogoutM= false;
        $rootScope.isSoundPlayedL1 = false;
        $rootScope.isSoundPlayedL2 = false;
        $rootScope.timerOn = false;
        $rootScope.digitsRendered = false;
        $rootScope.showVideo = false;
        $scope.myHints = function() {
            $scope.showHints = !$scope.showHints;
            if($scope.showHints) {
                $timeout(function() {
                    $scope.showHints = false;
                },10000);
            }
        }

        $rootScope.showMyhints;

        $scope.getHint = function () {
            profileService.getHint().then(function (result) {
                $rootScope.currentUser = result.user;
                $scope.user =  result.user;
            });
        };

        $scope.logout = function () {
            logoutService.logout();
            $rootScope.$broadcast('timerState', 'timerOffTimer');
            $scope.showLogoutM = !$scope.showLogoutM;
            // $location.path('/');
        };
        $scope.showLogoutModal = function(){
            $scope.showLogoutM = !$scope.showLogoutM;
        };

        $scope.getUserClock = function (reRenderDigits) {
            profileService.getUserClock().then(function (result) {
                $scope.user = result.user;
                    if (result.status === 'OK') {
                        // Re-render time:
                        if (reRenderDigits) {
                            result.user.game.timeEnd = new Date(result.user.game.timeEnd);
                            showDigits(result.user.game.timeEnd, toastr, $rootScope);
                        }
                    }
            });
        };

        // logout when time is up
        $scope.checkUserTime = function () {
            if($scope.user !== undefined && $scope.user.game !== undefined) {
                if ($scope.user.game.timeEnd !== undefined && new Date($scope.user.game.timeEnd) - new Date() < 0) {
                    // times up -> logout.
                    toastr.error('Times up!');
                    var data = {id: $scope.user._id};
                    var json = JSON.stringify(data);
                    logoutService.logoutTimesUp(json);
                    $rootScope.$broadcast('timerState', 'timerOffTimer');
                    return false;
                }
            }
            return true;
        };

        $scope.startCheckTime = function () {
            setTimeout(function () {
                if ($scope.checkUserTime()) {
                    $scope.startCheckTime();
                }
            }, 5000);
        };

        function preloadImages(srcArray) {
            for (var i = 0, len = srcArray.length; i < len; i++) {
                var img = new Image();
                img.src = srcArray[i];
                img.style.display = 'none';
                document.body.appendChild(img);
            }
        }

        preloadImages(['../img/Backgrounds/L1.jpg',
            '../img/Backgrounds/L2.jpg',
            '../img/Backgrounds/L3.jpg',
        '../img/Backgrounds/B1.jpg']);

    //    Timer
        $rootScope.$on('timerState', function (event, arg) {
                if(arg) {
                        if (arg == "turnOnTimer") {
                            $scope.startCheckTime();
                            $scope.getUserClock(true);
                            $rootScope.timerOn = true;
                        }
                    }
                    if (arg == "timerOffTimer") {
                        showDigits2($rootScope);
                        $rootScope.timerOn = false;
                    }
                }
        );
    }])

    .controller('tempCtrl', ['$scope', 'logginService', 'logoutService', 'toastr', '$rootScope', '$location','WebSocketService',
        function ($scope, logginService, logoutService, toastr, $rootScope, $location, WebSocketService) {
            $scope.login = function () {
                if ($scope.email && $scope.password) {
                    logginService.loggin($scope.email, $scope.password).then(function (result) {
                        if (result.status === 'OK') {

                            WebSocketService.login(result.user);
                            $rootScope.currentUser = result.user;
                            if ($rootScope.currentUser.game.level == 1)
                                $location.path('/level1');
                            if ($rootScope.currentUser.game.level == 2)
                                $location.path('/level2');
                            if ($rootScope.currentUser.game.level == 3)
                                $location.path('/level3');
                            if ($rootScope.currentUser.game.level == 4)
                                $location.path('/final');
                            toastr.success('Logged In');
                        }
                        else
                         {
                            toastr.error(result.message);
                         }
                    });
                } else {
                    toastr.error('Must provide a valid email and password');
                }
            };
        }])
    .controller('signupCtrl', ['$scope', 'signupService', 'toastr', '$rootScope', '$location', 'WebSocketService', function ($scope, signupService, toastr, $rootScope, $location, WebSocketService) {
        $scope.intro = true;
        $scope.goToSignup = function()
        {
            $scope.intro = false;
        }
        $scope.signup = function () {
            if ($scope.firstName && $scope.lastName && $scope.email && $scope.password) {
                var data = {
                    email: $scope.email,
                    password: $scope.password,
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                };
                signupService.signup(data)
                    .then(function (result) {
                        if (result.status === 'OK') {
                            $rootScope.currentUser = result.user;
                            $location.path('/level1');
                            return WebSocketService.login(result.user);
                        } else {
                            toastr.error(result.message);
                        }
                    }).then(function () {

                }).catch(function (e) {
                    toastr.error(e);
                });
            } else {
                toastr.error('All fields are required');
            }
        }

    }])
    .controller('level3Ctrl', ['$scope', 'level3Service','profileService','$rootScope', 'toastr', '$timeout', '$location', function ($scope, level3Service, profileService, $rootScope, toastr, $timeout, $location) {
        $rootScope.showMyhints = true;
        $rootScope.currentUser.game.hints={};
        $scope.canPlay= true;
        //Timer ----
        $scope.$on('$viewContentLoaded', function(){
            if (!$rootScope.timerOn && !$rootScope.digitsRendered) {
                $rootScope.$broadcast('timerState', 'turnOnTimer');
            }
        });
        //Timer ----

        $scope.submitLicensePlate = function () {
            var answerInputDiv = angular.element(document.querySelector('#licensePlateInput'));
            var data = {
                licensePlate: answerInputDiv[0].value
            };

            function defListeneer(){
                document.getElementById('licensePlateInput').addEventListener("keyup", function(event) {
                    event.preventDefault();
                    if (event.keyCode == 13) {
                        document.getElementById("approveButtonId").click();
                    }
                });
            }

            defListeneer();

            level3Service.submitLicensePlate(data).then(function (result) {
                if (result.status === 'OK') {
                    document.getElementById('submitResponseSuccessLabel').innerText = result.message;

                    $scope.showHints = false;
                    $rootScope.currentUser.game.hints={};
                    $scope.finishTime = new Date();
                    var snd = new Audio("../img/carStart.mp3");
                    snd.play();
                    $timeout(function() {
                        $rootScope.showVideo = true;
                        var video = $("#video3");
                        video.autoplay = true;
                        video.load();
                    },8000);
                    $timeout(function() {
                        $rootScope.showVideo = false;
                        $location.path('/final');
                        removeDigits();
                        if($scope.canPlay) {
                            $scope.canPlay= false;
                            var snd = new Audio("../img/applause-2.mp3"); // buffers automatically when created
                            snd.play();
                        }
                    },12000);
                }
                else {
                    document.getElementById('submitResponseErrorLabel').innerText = result.message;
                    $timeout(function(){
                        var element= document.getElementById('submitResponseErrorLabel');
                        element.style.opacity= 0;
                    },3200);
                    $timeout(function(){
                        var element= document.getElementById('submitResponseErrorLabel');
                        element.style.opacity= 1;
                        element.innerText = "";
                    },3500);
                }
            });
        }
    }])

    .controller('level2Ctrl', ['$scope', 'chatService','profileService','$rootScope', '$interval','$timeout','toastr', '$timeout', '$location', 'WebSocketService', function ($scope, chatService,profileService, $rootScope, $interval, $timeout,toastr,$timeout, $location, WebSocketService) {
        $rootScope.showMyhints = true;
        $rootScope.currentUser.game.hints = {};
        $rootScope.allMassages = [];

        //Timer ----
        $scope.$on('$viewContentLoaded', function(){

            if (!$rootScope.timerOn && !$rootScope.digitsRendered) {
                $rootScope.$broadcast('timerState', 'turnOnTimer');
            }
        });
        //Timer ----

        window.turnGreenLightOn = function() {
            new Audio("../img/buttonClick.mp3").play();
            var data = {id: $scope.currentUser._id};
            var json = JSON.stringify(data);
            chatService.changeTrafficLight(json).then(function (result, err) {
                if (err) {
                    console.log(err);
                }
                if (result.status === "401") {
                    document.getElementById('errorLabel').innerText = "401 - You are not Admin. You are not authorized for this action!"
                    $timeout(function () {
                        var element = document.getElementById('errorLabel');
                        element.style.opacity = 0;

                    }, 3200);
                    $timeout(function () {
                        var element = document.getElementById('errorLabel');
                        element.innerText = "";
                        element.style.opacity = 1;

                    }, 3500);
                } else if(result.status == "OK"){
                    document.getElementById('errorLabel').innerText = result.status + "! XSS successful !!"
                    $timeout(function () {
                        var element = document.getElementById('errorLabel');
                        element.style.opacity = 0;

                    }, 3200);
                    $timeout(function () {
                        var element = document.getElementById('errorLabel');
                        element.innerText = "";
                        element.style.opacity = 1;

                    }, 3500);
                }
            });
        }

        $rootScope.checkLevel2 = $interval(function () {
            var currentUser_id = {id: $scope.currentUser._id};
            var id_json = JSON.stringify(currentUser_id);
            chatService.getAllMassages(id_json).then(function (result) {
                $('.bubble').each(function () {
                    var $this = $(this);
                    var t = $this.text();
                    $this.html(t.replace('&lt', '<').replace('&gt', '>'));
                });
                if (result.status === 'OK') {
                    $scope.allMassages = result.allMassages;
                }
            });
        }, 0,2);

        var currentUser_id = {id: $scope.currentUser._id};
        var id_json = JSON.stringify(currentUser_id);
        chatService.getAllMassages(id_json).then(function (result) {
            $('.bubble').each(function () {
                var $this = $(this);
                var t = $this.text();
                $this.html(t.replace('&lt', '<').replace('&gt', '>'));
            });
            if (result.status === 'OK') {
                $scope.allMassages = result.Messages;
                $rootScope = $scope;
                $rootScope.$apply();
            }
        });

        $rootScope.$on("ws:result2", function (e, data) {
            $scope.user = data.data.user;
            $scope.Messages = data.data.allMassages;
            $scope.result = data.data.result;

            if($scope.user.game.level === 3) {
                if (!$rootScope.isSoundPlayedL2) {
                    $rootScope.isSoundPlayedL2 = true;
                    toastr.success("XSS Successful!!");
                    var snd = new Audio("../img/carStart.mp3");
                    snd.play();
                }
                $timeout(function() {
                    $rootScope.showVideo = true;
                    var video = $("#video2");
                    video.autoplay = true;
                    video.load();
                },8000);
                $timeout(function() {
                    $rootScope.showVideo = false;
                    location.reload();
                },12000);
            }
            else{
                if ($scope.currentUser) {
                    if($scope.Messages) {
                        $('.bubble').each(function () {
                            var $this = $(this);
                            var t = $this.text();
                            $this.html(t.replace('&lt', '<').replace('&gt', '>'));
                        });
                        if ($scope.result.status === 'OK') {
                            $scope.allMassages = $scope.Messages;
                            $scope.$apply();
                        }
                    }
                }
            }
        });

        function defListeneer(){
            document.getElementById('chatInput').addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode == 13) {
                    document.getElementById("chatButton").click();
                }
            });
        }
        defListeneer();

        $scope.sendMessage=function(){
            var text= document.getElementById('chatInput').value;
            if(text== undefined ||  text.length===0)
                return;

            var data = {
                content: text,
                author: $rootScope.currentUser.firstName,
                playerID: $rootScope.currentUser.local.email,
            };
            var json = JSON.stringify(data);

            chatService.say(json).then(function(result){
                if(result.status === 'OK')
                {
                    console.log("Massage sent : " + text    );
                    $timeout(function () {
                        var snd = new Audio("../img/sounds/send.mp3"); // buffers automatically when created
                        snd.play();
                    }, 500);

                    if ($scope.currentUser) {
                        var data = {id: $scope.currentUser._id};
                        var json = JSON.stringify(data);
                        chatService.getAllMassages(json).then(function(result2){
                        });
                    }

                }else {
                    console.log('Error!');
                }
            });

            document.getElementById('chatInput').value = "";
        }

    }])
    .controller('level1Ctrl', ['$scope', 'level1Service','profileService','$rootScope','toastr', '$timeout', '$location', 'WebSocketService', function ($scope, level1Service,profileService, $rootScope,toastr,$timeout, $location, WebSocketService) {
        // On user submit answer:

        //Timer ----
        $scope.$on('$viewContentLoaded', function(){
            if (!$rootScope.timerOn && !$rootScope.digitsRendered) {
                $rootScope.$broadcast('timerState', 'turnOnTimer');
            }
        });
        //Timer ----

        $rootScope.showMyhints = true;
        $rootScope.$on("ws:result", function (e, data) {
            //debugger;
            $scope.user = data.data;
            if ($scope.user.game.level === 2) {
                if (!$rootScope.isSoundPlayedL1) {
                    $rootScope.$apply(function() {
                        $scope.success = true;
                        var snd = new Audio("../img/carStart.mp3");
                        snd.play();
                        $rootScope.isSoundPlayedL1 = true;
                    });

                    $timeout(function () {
                      $rootScope.showVideo = true;
                      var video = $("#video1");
                      video.autoplay = true;
                      video.load();
                    }, 8000);
                }

                $scope.showHints = false;
                $timeout(function () {
                    $rootScope.$apply(function() {
                        $rootScope.showVideo = false;
                        $location.path("/level2");
                    });
                }, 12000);
            }
        });

        $scope.success = false;
        $scope.fail=false;
        var inputCounter = 0;
        var trialsNum = 0;

        $scope.submitPin = function () {
            var answerInputDiv = angular.element(document.querySelector('#pinInput'));
            var data = {
                pin: answerInputDiv[0].value
            };

            level1Service.submitPin(data).then(function (result) {

                $scope.user = data.data;
                if ($scope.user.game.level === 2) {
                    if (!$rootScope.isSoundPlayedL1) {
                        $rootScope.$apply(function() {
                            $scope.success = true;
                            var snd = new Audio("../img/carStart.mp3");
                            snd.play();
                            $rootScope.isSoundPlayedL1 = true;
                        });

                        $timeout(function () {
                            $rootScope.showVideo = true;
                            var video = $("#video1");
                            video.autoplay = true;
                            video.load();
                        }, 8000);
                    }

                    $scope.showHints = false;
                    $timeout(function () {
                        $rootScope.$apply(function() {
                            $rootScope.showVideo = false;
                            $location.path("/level2");
                        });
                    }, 12000);
                }
            });
        };

        function preloadImages(srcArray) {
            for (var i = 0, len = srcArray.length; i < len; i++) {
                var img = new Image();
                img.src = srcArray[i];
                img.style.display = 'none';
                document.body.appendChild(img);
            }
        }

        function preloadSounds(srcArray) {
            for (var i = 0, len = srcArray.length; i < len; i++) {
                var snd = new Audio();
                snd.src = srcArray[i];
                document.body.appendChild(snd);
            }
        }

        var snd = preloadSounds(['../img/beep-24.mp3',
            '../img/beep-21.mp3',
        '../img/carStart.mp3']);

        var img  =  preloadImages(['../img/Kodan/kodan.png',
            '../img/Kodan/1_hover.png',
            '../img/Kodan/2_hover.png',
            '../img/Kodan/3_hover.png',
            '../img/Kodan/4_hover.png',
            '../img/Kodan/5_hover.png',
            '../img/Kodan/x_hover.png',
            '../img/Kodan/1_press.png',
            '../img/Kodan/2_press.png',
            '../img/Kodan/3_press.png',
            '../img/Kodan/4_press.png',
            '../img/Kodan/5_press.png',
            '../img/Kodan/x_press.png',
            '../img/Kodan/kodan.png',
            '../img/Kodan/KodanNumbers/1.png',
            '../img/Kodan/KodanNumbers/2.png',
            '../img/Kodan/KodanNumbers/3.png',
            '../img/Kodan/KodanNumbers/4.png',
            '../img/Kodan/KodanNumbers/5.png']);

        var pin = "";
        document.getElementById('c1').addEventListener("mouseover", mouseOver1);
        document.getElementById('c1').addEventListener("mouseout", mouseOut);
        document.getElementById('c2').addEventListener("mouseover", mouseOver2);
        document.getElementById('c2').addEventListener("mouseout", mouseOut);
        document.getElementById('c3').addEventListener("mouseover", mouseOver3);
        document.getElementById('c3').addEventListener("mouseout", mouseOut);
        document.getElementById('c4').addEventListener("mouseover", mouseOver4);
        document.getElementById('c4').addEventListener("mouseout", mouseOut);
        document.getElementById('c5').addEventListener("mouseover", mouseOver5);
        document.getElementById('c5').addEventListener("mouseout", mouseOut);
        document.getElementById('c6').addEventListener("mouseover", mouseOver6);
        document.getElementById('c6').addEventListener("mouseout", mouseOut);

        document.getElementById('c1').addEventListener("mousedown",click1);
        document.getElementById('c1').addEventListener("mouseup",mouseUp);
        document.getElementById('c2').addEventListener("mousedown",click2);
        document.getElementById('c2').addEventListener("mouseup",mouseUp);
        document.getElementById('c3').addEventListener("mousedown",click3);
        document.getElementById('c3').addEventListener("mouseup",mouseUp);
        document.getElementById('c4').addEventListener("mousedown",click4);
        document.getElementById('c4').addEventListener("mouseup",mouseUp);
        document.getElementById('c5').addEventListener("mousedown",click5);
        document.getElementById('c5').addEventListener("mouseup",mouseUp);
        document.getElementById('c6').addEventListener("mousedown",click6);
        document.getElementById('c6').addEventListener("mouseup",mouseUp);

        function mouseOver1() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/1_hover.png \")";

        }
        function mouseOver2() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/2_hover.png \")";

        }
        function mouseOver3() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/3_hover.png \")";

        }
        function mouseOver4() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/4_hover.png \")";

        }
        function mouseOver5() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/5_hover.png \")";

        }
        function mouseOver6() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/x_hover.png \")";

        }

        function mouseOut() {
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/kodan.png \")";
        }
        function mouseUp() {
            document.getElementById('codan').style.backgroundImage ="url(\"../img/Kodan/kodan.png \")";
        }
        function click1() {
            addToPin(1);
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/1_press.png \")";
            fillInput("\"../img/Kodan/KodanNumbers/1.png \"");
        }

        function click2() {
            addToPin(2);
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/2_press.png \")";
            fillInput("\"../img/Kodan/KodanNumbers/2.png \"");

        }

        function click3() {
            addToPin(3);
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/3_press.png \")";
            fillInput("\"../img/Kodan/KodanNumbers/3.png \"");

        }

        function click4() {
            addToPin(4);
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/4_press.png \")";
            fillInput("\"../img/Kodan/KodanNumbers/4.png \"");

        }

        function click5() {
            addToPin(5);
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/5_press.png \")";
            fillInput("\"../img/Kodan/KodanNumbers/5.png \"");

        }

        function click6() {
            new Audio("../img/beep-24.mp3").play();
            document.getElementById('codan').style.backgroundImage = "url(\"../img/Kodan/x_press.png \")";
            fillInput("star");
        }

        function fillInput(imageUrl)
        {
            var elmArr = document.getElementsByClassName("input");
            var star = false;

            inputCounter++;
            if (imageUrl === "star") {
                var counter = 0;
                for (var i = 0; i < elmArr.length; i++) {

                    if (elmArr[i].style.backgroundImage !== undefined && elmArr[i].style.backgroundImage !== "") { //how many digits were pressed by now?
                        counter++;
                    }
                }
                if (counter < 4) {
                    for (var j = 0; j < counter; j++) {
                        elmArr[j].style.backgroundImage = "";
                    }

                    $scope.fail=true;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.fail=false;
                    }, 500);
                    pin = "";
                }
                star = true;
            }

            for (var i = 0; i < elmArr.length; i++) {
                if (inputCounter > 4 && !star)
                {
                    for (var j = 0; j < elmArr.length; j++)
                    {
                        elmArr[j].style.backgroundImage = "";
                    }
                    pin = "";
                    $scope.fail=true;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.fail=false;
                    }, 500);
                    inputCounter = 0;
                    break;
                }

                if (elmArr[i].style.backgroundImage === undefined || elmArr[i].style.backgroundImage === "") {
                    if (imageUrl !== 'star') {
                        elmArr[i].style.backgroundImage = "url(" + imageUrl + ")";
                        elmArr[i].style.backgroundRepeat = "no-repeat";

                        break;
                    }
                }

                if (i === 3 && star) {
                    //submit to server
                    if (pin.length === 4) {
                        var form = document.getElementById("submitPin");
                        var input = document.getElementById('pinInput');
                        input.type = 'hidden';
                        input.value = pin;
                        form.appendChild(input);
                        $scope.submitPin();

                    }
                    //clear
                    for (var j = 0; j < elmArr.length; j++)
                    {
                        elmArr[j].style.backgroundImage = "";
                        inputCounter = 0;
                    }
                    pin = "";
                }
                else {

                }

            }
        }

        function addToPin(num) {
            pin = pin + "" + num;
            new Audio("../img/beep-21.mp3").play();
        }

        $scope.success = false;
        $scope.fail = false;

    }])

    .controller('finalCtrl', ['$scope', 'profileService' , 'toastr', '$rootScope', function ($scope, profileService, toastr, $rootScope) {
        $scope.getuserclock = function(){
            profileService.getUserInfo("{\'s\':\'a\'}").then(function (result) {
                if (result.status === 'OK') {
                    $scope.user = result.user;
                    showDigits2($rootScope);
                    var diffMs = new Date() - new Date($scope.user.game.timeStart) ;
                    var diffMins = diffMs < 0 ? 0 : Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                    var diffsc = diffMs < 0 ? 0 : Math.round((diffMs / 1000) % 60);
                    var str = 'You have completed the challenge in ' + diffMins +':' + diffsc + ' minutes!';
                    $('#challengeTime').text(str);
                    var str = 'You have used ' + $scope.user.game.hintsNum + ' hints out of 12!';
                    $('#hintsAmount').text(str);
                }
            });
        }

        $scope.getuserclock();
    }])


    .controller('profileCtrl', ['$scope', 'profileService', '$rootScope', function ($scope, profileService, $rootScope) {
        $scope.getuserinfo = function () {
            profileService.getUserInfo().then(function (result) {
                if (result.status === 'OK') {
                    $scope.user = result.user;
                }
            });
        };
        $scope.getuserinfo();

    }])
    .controller('aboutCtrl', ['$scope', '$location','$rootScope', function ($scope,$location, $rootScope) {
        $rootScope.showMyhints = false;
        $scope.backToGame = function(){
            if($rootScope.currentUser.game.level == 1)
                $location.path('/level1');
            if($rootScope.currentUser.game.level == 2)
                $location.path('/level2');
            if($rootScope.currentUser.game.level == 3)
                $location.path('/level3');
            if($rootScope.currentUser.game.level == 4)
                $location.path('/final');

        }
    }])
    .controller('helpCtrl', ['$scope', '$location','$rootScope', function ($scope, $location, $rootScope) {
        $rootScope.showMyhints = false;
        $scope.backToGame = function(){
            if($rootScope.currentUser.game.level == 1)
                $location.path('/level1');
            if($rootScope.currentUser.game.level == 2)
                $location.path('/level2');
            if($rootScope.currentUser.game.level == 3)
                $location.path('/level3');
            if($rootScope.currentUser.game.level == 4)
                $location.path('/final');
        }

    }])

function showDigits(userTimeEnd, toastr, rootScope) {
    var digits = angular.element(document.querySelector('.digits'));

    if(digits.length === 0)
    {
        digits = angular.element('<div class="col-sm-5 col-sm-offset-3 digits" ng-show="$root.currentUser && ($root.currentUser.game.level >= 1 || $root.currentUser.game.level <= 3)" > </div>');
        var timer = angular.element( document.querySelector( '.timer' ) );
        timer.append(digits);
    }
    if(!rootScope.digitsRendered) {
        digits.countdown({
            stepTime: 60,
            image: "img/digits.png",
            digitWidth: 67,
            digitHeight: 90,
            format: "mm:ss",
            endTime: userTimeEnd,
            continuous: false,
            start: true,
            timerEnd: function () {
                toastr.error('Time is up!');
            }
        });
        rootScope.digitsRendered  = true;
    }
}

function showDigits2(rootScope) {
    var digits = angular.element(document.querySelector('.digits'));
    if(rootScope) {
        if (rootScope.digitsRendered) {
            digits.countdown({
                endTime: new Date(),
                continuous: false,
                start: false
            });
            rootScope.digitsRendered = false;
        }
    }
    removeDigits();
}

function removeDigits()
{
    var digits = angular.element(document.querySelector('.digits'));
    digits.remove();
    digits.empty();
    var cntDigit = $('.cntDigit');
    if(!(cntDigit === undefined || cntDigit === null || cntDigit.length === 0))
    {
        cntDigit.remove();
        cntDigit.empty();
    }
}

function setUiHints(scope) {
    scope.isHintDisabled = !scope.user.game.hasMoreHints;
}

function setConfirmationToken(scope, confirmation, confK) {
    scope.confirmationToken = true;
    scope.confKey = confK;
}
