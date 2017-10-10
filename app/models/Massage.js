/**
 * Created by I323891 on 31/01/2017.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Crypter = require('cryptr'), crypter = new Crypter("305810343");

mongoose.createConnection('mongodb://localhost/messenger');
// mongoose.set('debug',true);
// define the schema for our user model
var massageSchema = mongoose.Schema({
   massage: {type:String,default: "Empty" },
    author: String,
    playerID: String,
});

massageSchema.methods.printContent = function () {
    console.log(this.massage);
    console.log(this.author);
    console.log(this.playerID);
    console.log(this.local.role);
    console.log(this.local.course);
}
function Massage(massage){
    this.massage= massage;
}
module.exports = mongoose.model('Massage', massageSchema);
