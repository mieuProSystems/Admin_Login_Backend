var mongoose = require('mongoose');

var feedbackSchema = new mongoose.Schema({
    userMail : {type : String, required:true },
    feedback : {type : String },
    givenTime : {type : String }
});

var Feedback = mongoose.model('feedback',feedbackSchema);

module.exports = Feedback;