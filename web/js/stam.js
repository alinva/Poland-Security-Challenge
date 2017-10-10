/**
 * Created by I323891 on 24/01/2017.
 */
var Crypter = require('cryptr');
var c= new Crypter("305810343");
// var Massage = require('../../app/models/Massage');
// var csss = require("../../node_modules/simple-nodejs-chat")
// var Chat = require('../../app/models/Chat').Chat;
//
// var chat =new Chat();
// var m = new Massage({massage:"Hello POOP Face"});
// chat.say(m);
//
// chat.getAllMassages(function(res){
//     console.log("Thats All:"+res);
// });
// // a.forEach(function(e){e.printContent()});
// return;
// var m= new Massage({
//     massage: "tralala ",
//     "local.role":"KwaKWa"
// });
// m.printContent();

console.log(c.decrypt('0bd310e1'));
console.log("player: " + c.encrypt('player'));
console.log("Admin: " + c.encrypt('Admin'));
console.log("Global: " + c.encrypt('Global'));


// function defineListener(){
//     document.getElementById('chatInput').addEventListener("keyup", function(event) {
//         event.preventDefault();
//         if (event.keyCode == 13) {
//             document.getElementById("chatButton").click();
//         }
//     });
// }
// function sendMessage(){
//     var text= document.getElementById('chatInput').value;
//     if(text== undefined ||  text.length===0)
//         return;
//
//     var children= document.getElementById('chatwindow').children;
//     var removeFirstElement = function (children) {
//     children[0].remove();
//     children[0].remove();
//     };
//     if(children.length>=6)
//         removeFirstElement(children);
//
//     var newElement = document.createElement("IMG");
//     newElement.setAttribute('src','../img/Elements/bigBubble.png');
//     newElement.setAttribute('width','500');
//     newElement.setAttribute('height','100');
//     var newDiv= document.createElement("DIV");
//     newDiv.setAttribute("class","bubble");
//     newDiv.innerText = text;
//     newElement.appendChild(newDiv);document.getElementById('chatwindow').appendChild(newElement);
//     newElement.appendChild(newDiv);document.getElementById('chatwindow').appendChild(newDiv);
//     document.getElementById('chatInput').value = "";
// }
//
// function turnGreenLightOn() {
//        document.getElementById('errorLabel').innerText = "You are not authorized for this action!"
//     setTimeout(function(){
//         var element= document.getElementById('errorLabel');
//         element.style.opacity = 0;
//
//     },3200);
//     setTimeout(function(){
//         var element= document.getElementById('errorLabel');
//         element.innerText ="";
//         element.style.opacity=1;
//
//     },3500);
// }

//
// var SerialPort = require("serialport");
// var serialport = new SerialPort("/dev/tty.usbmodem1421");
// serialport.on('open', function(){
//     console.log('Serial Port Opend');
//     serialport.on('data', function(data){
//         console.log(data[0]);
//     });
// });

