var mongoose = require('mongoose');

var feedbackSchema = new mongoose.Schema({
    userMail    : {type : String, required:true },
    feedback    : {type : String },
    givenDate   : {type : String },
    givenTime   : {type : String},
    read        : {type : Boolean, default : false}
});

var Feedback = mongoose.model('feedback',feedbackSchema);

module.exports = Feedback;