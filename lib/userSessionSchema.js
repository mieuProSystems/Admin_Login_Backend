var mongoose = require('mongoose');

try{
var sessionSchema = new mongoose.Schema({
    userMail : {type : String, required : true},
    loginToken: { type: String, required: true , unique : true },
    firstName : {type : String, required : true},
    lastName : {type : String, required : true},
    loginTime : { type: String, required: true },
    logoutTime : { type: String }
});

var userSession = mongoose.model('usersessions',sessionSchema);

module.exports = userSession;
}
catch(err){
    console.log("Error in creating User Session Schema \n" + err);
}