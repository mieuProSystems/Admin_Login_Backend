var mongoose = require('mongoose');

try{
//Schema for the User 
var userSchema = new mongoose.Schema({
    firstName           : {type : String, required : true},
    lastName            : {type : String, required : true},
    gender              : {type : String, required : true},
    userMail            : {type : String, unique : true, required : true},
    password            : {type : String, required : true},
    mobileNo            : {type : Number},
    isLogged            : {type : Boolean, default : false},
    isVerified          : {type : Boolean, default : false},
    token               : {type : String, required: true , unique : true },
    createdAt           : {type : String, required: true },
    changePasswordToken : {type : String}
});

//Creating a collection for Admin in the DB
var User = mongoose.model('User', userSchema);

module.exports = User;
}
catch(err){
    console.log("Error in creating User Schema \n" + err);
}