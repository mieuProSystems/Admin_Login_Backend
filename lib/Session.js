var mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema({
    userMail : {type : String, required : true},
    token: { type: String, required: true , unique : true },
    firstName : {type : String, required : true},
    lastName : {type : String, required : true},
    loginTime : { type: String, required: true },
    logoutTime : { type: String }
});

var Session = mongoose.model('usersessions',sessionSchema);

module.exports = Session;