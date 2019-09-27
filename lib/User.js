var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    firstName : {type : String, required : true},
    lastName : {type : String, required : true},
    gender : {type : String, required : true},
    userMail : {type : String, unique : true, required : true},
    password : {type : String, required : true},
    mobileNo : {type : String},
    isLogged : {type : Boolean, default : false},
    isVerified : {type : Boolean, default : false},
    passwordResetToken: String,
    passwordResetExpires: Date,
    token: { type: String, required: true , unique : true },
    createdAt: { type: String, required: true }
});

var User = mongoose.model('users1', userSchema);

module.exports = User;

