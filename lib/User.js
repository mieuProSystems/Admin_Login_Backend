var mongoose = require('mongoose');

//User Schema for the Admin
var userSchema = new mongoose.Schema({
    firstName : {type : String, required : true},
    lastName : {type : String, required : true},
    gender : {type : String, required : true},
    userMail : {type : String, unique : true, required : true},
    password : {type : String, required : true},
    mobileNo : {type : String},
    isLogged : {type : Boolean, default : false},
    isVerified : {type : Boolean, default : false},
    token: { type: String, required: true , unique : true },
    createdAt: { type: String, required: true }
});

//Creating a collection for Admin in the DB
var User = mongoose.model('Admin', userSchema);

module.exports = User;
