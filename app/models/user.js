// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Crypter = require('cryptr'), crypter = new Crypter("305810343");
// define the schema for our user model
var userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    local: {
        email: String,
        password: String,
        pin: String,
        isFirst: {type: Number, default: 0},
        course: {type: Number, default: -1},
    },
    game: {
        level: {type: Number, default: 1},
        score: {type: Number, default: 0},
        hints: [String],
        hintsNum: {type: Number, default: 0},
        hasMoreHints: Boolean,
        timeStart: {type: Date},
        timeEnd: {type: Date},
        timeUserFinished: {type: Date}
    }
});

// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

//create new individual pin code
userSchema.methods.createNewPinCode = function () {
    var permutations = [
        1125,
        1152,
        1215,
        1225,
        2115,
        2125,
        2151,
        2152,
        2155,
        2215,
    ];
    var l =  (permutations.length-1 )/2;
    var rand = Math.round(Math.random()*l);
    var ret = permutations[rand];
    console.log(rand);
    console.log(ret);
    console.log(crypter.encrypt(ret));
    return crypter.encrypt(ret);

}
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
