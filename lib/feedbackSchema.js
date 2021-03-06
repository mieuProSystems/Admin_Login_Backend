var mongoose = require('mongoose');

try {
    var feedbackSchema = new mongoose.Schema({
        userMail: {
            type: String,
            required: true
        },
        userName: {
            type : String,
            required: true
        },
        feedback: {
            type: String,
            required: true
        },
        givenDate: {
            type: String
        },
        givenTime: {
            type: String
        },
        read: {
            type: Boolean,
            default: false
        },
        isReplied: {
            type : Boolean,
            default : false
        },
        repliedMessage: {
            type : String,
            default:''
        } 
    });

    var Feedback = mongoose.model('feedback', feedbackSchema);

    module.exports = Feedback;
} catch (err) {
    console.log("Error in creating Feedback Schema \n" + err);
}