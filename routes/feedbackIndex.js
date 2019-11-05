var express = require('express');
var feedbackRouter = express.Router();
var nodemailer = require('nodemailer');
var moment = require('moment-timezone');
var Feedback = require('../lib/feedbackSchema');

//to get feedback from user
feedbackRouter.get('/user/feedback', function (req, res) {
  try {
    var userMail = req.body.userMail;
    var feedback = req.body.feedback;
    var userName = req.body.userName;

    var new_feedback = new Feedback();

    new_feedback.userMail = userMail;
    new_feedback.feedback = feedback;
    new_feedback.userName = userName;
    new_feedback.givenDate = moment().format("DD/MM/YYYY");
    new_feedback.givenTime = moment().utcOffset("+05:30").format('HH:mm:ss');
    new_feedback.save(function (err, feedback) {
      if (feedback) {
        console.log("Feedback saved successfully");
        return res.status(200).send(JSON.stringify({
          "description": "Feedback has been saved successfully",
          "status": "success"
        }));
      } else {
        console.log("Error in saving feedback");
        return res.status(200).send(JSON.stringify({
          "description": "Error in saving feedback",
          "status": "failed"
        }));
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//to send the feedback
feedbackRouter.get('/home/admin/getFeedback', function (req, res) {
  try {
    var usersProjection = {
      __v: false,
      _id: false
    };

    Feedback.find({}, usersProjection).sort('-givenDate').sort('-givenTime').exec(function (err, feedback) {
      if (err) return next(err);
      console.log("Feedbacks sent successfully");
      res.send(JSON.stringify(feedback));
      return res.status(200);
    });

    // Feedback.find({}, usersProjection, function(err, feedback){
    //   const dateFormat = (date, time) => new Date (date+time);
    //   feedback.sort((a,b)=>dateFormat(a.givenDate,a.givenTime)-dateFormat(b.givenDate-b.givenTime));
    //   feedback.reverse();
    //   console.log(feedback);
    //    res.send(JSON.stringify(feedback));
    //    return res.status(200);

    // });

  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Admin read the feedback confirmation
feedbackRouter.get('/home/admin/readFeedback', function (req, res) {
  try {
    var myquery = {
      read: false
    };
    var newvalues = {
      $set: {
        read: true
      }
    };
    Feedback.updateMany(myquery, newvalues, function (err, response) {
      if(response){
      if (response.nModified != 0) {
        console.log("Admin read Feedbacks");
        return res.send(JSON.stringify({
          "description": "Admin read Feedbacks",
          "status": "success"
        }));
      } else {
        console.log("All feedbacks are already read");
        return res.send(JSON.stringify({
          "description": "All feedbacks are already read",
          "status": "success"
        }));
      }
    }
    else {
      console.log('You don\'t have the permission to change the database');
      return res.send(JSON.stringify({
        "description": 'You don\'t have the permission to change the database',
        "status": "failed"
      }));
    }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//To reply for the feedback
feedbackRouter.post('/home/admin/replyFeedback', function (req, res) {
  try {
    var message = req.body.replyMessage;

    var myquery = {
      givenDate: req.body.givenDate,
      givenTime: req.body.givenTime,
      userMail: req.body.userMail
    };
    var newvalues = {
      $set: {
        repliedMessage: req.body.replyMessage,
        isReplied: true,
        read: true
      }
    };
    Feedback.findOneAndUpdate(myquery, newvalues, function (err, response) {
      if (response){
      if (response.isModified != 0) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD
          }
        });
        var mailOptions = {
          to: req.body.userMail,
          subject: 'Reply for your Feedback',
          text: message
        };
        smtpTransport.sendMail(mailOptions, async function (err) {
          if (err) {
            return res.send(JSON.stringify({
              "description": "Error in sending feedback",
              "status": "failed"
            }));
          }
          console.log('Reply for feedback has been sent to ' + req.body.userMail);
          return res.send(JSON.stringify({
            "description": 'Reply for feedback has been sent to ' + req.body.userMail,
            "status": "success"
          }));
        });
      }
      else {
        console.log('No match to change in reply feedback');
        return res.send(JSON.stringify({
          "description": 'No matches found for ' + req.body.userMail + ' and other data',
          "status": "failed"
        }));
      }
     }
     else {
      console.log('You don\'t have the permission to change the database');
      return res.send(JSON.stringify({
        "description": 'You don\'t have the permission to change the database',
        "status": "failed"
      }));
    } 
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

module.exports = feedbackRouter;
