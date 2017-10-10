var SerialPort = require("serialport");
var serialport = require('serialport');// include the library
// // //
var myPort = new SerialPort("COM5", {
    baudRate: 9600,
    // look for return and newline at the end of each data packet:
     parser: serialport.parsers.readline("\n")
});
//



//
//
myPort.on('open', showPortOpen);
//myPort.write("1g");
function showPortOpen() {
    setTimeout(function(){
        // myPort.write("8d");

        // myPort.write("8g");
        // myPort.write("8d");
        //
        myPort.write("8o");
        myPort.write("8d");

        //
    },1000);

























    //  setTimeout(function(){
    //     console.log("This Is My RaceNum : " +RaceNum);
    //     myPort.write("1d");
    //     myPort.write("2d");
    //     myPort.write("3d");
    //     myPort.write("4d");
    //     myPort.write("5d");
    //     myPort.write("6d");
    //     myPort.write("7d");
    //     myPort.write("8d");
//     setTimeout(function(){
//         //console.log("This Is My RaceNum : " +RaceNum);
//         myPort.write("1c");
//         myPort.write("2c");
//         myPort.write("3c");
//         myPort.write("4c");
//         myPort.write("5c");
//         myPort.write("6c");
//         myPort.write("7c");
//         myPort.write("8c");
// //
//     },10000)


}


//myPort.on('open', showPortOpen);
//console.log("I am in StartRace");
//function showPortOpen() {
//   setTimeout(function(){

//     myPort.write(trackNumber+"g"); // green light
//    myPort.write(trackNumber+"c"); // close the barrier
//   console.log("Setting Track : " + trackNumber);
// setTimeout(function(){
//     myPort.close(function (err) {
//         console.log('port closed', err);
//     });
//
// },3000)
//},1000)
//}
