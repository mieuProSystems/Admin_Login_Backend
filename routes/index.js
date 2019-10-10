var express = require('express');
var router = express.Router();
var User = require('../lib/User');
var Session = require('../lib/Session');
var Channel = require('../lib/Channel');
var Feedback = require('../lib/Feedback');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var _ = require('underscore');
var firstName, lastName, userMail, password, gender, mobileNo, sessionToken ;

//Register page
router.post('/register',async(req,res) =>{
   firstName = req.body.firstName;
   lastName = req.body.lastName;
   gender = req.body.gender;
   userMail = req.body.userMail;
   password = req.body.password;
   mobileNo = req.body.mobileNo;
   
   var tokenForAuthentication;
   var newuser = new User();

   let user = await User.findOne({ userMail: req.body.userMail});
    if(user){
      if(user.isVerified){
      console.log('Usermail ' + req.body.userMail + ' already exists');
      return res.send(JSON.stringify({"description":"Your email is already registered...Please login","status" : "failed"}));
      }
      else
      {
        let myquery = { userMail : user.userMail};
        let newvalues = { $set : {firstName : req.body.firstName , lastName : req.body.lastName,
          gender : req.body.gender,password : req.body.password,mobileNo : req.body.mobileNo , createdAt : Date(Date.now())}};
        User.updateOne(myquery, newvalues, function(err, response){
          if(err){
            console.log(err);
          }
        });
        tokenForAuthentication = user.token;
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'cloudofanonym@gmail.com',
            pass: 'l!fesucks'
          }
        });
        var mailOptions = {
          to: req.body.userMail,
          from: 'mail tester',
          subject: 'Request for registration',
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + tokenForAuthentication + '.\n' 
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          
          console.log('An e-mail has been sent to ' + req.body.userMail + ' for registration');
          return res.send(JSON.stringify({"description":"Your request has not been verified yet...Activation link has been sent to your entered mail again!!!", "status": "success"}));
        });
      }
    }
      else{
        newuser.firstName = firstName;
        newuser.lastName = lastName;
        newuser.gender = gender;
        newuser.userMail = userMail;
        newuser.password = password;
        newuser.mobileNo = mobileNo;
        newuser.token = crypto.randomBytes(16).toString('hex');
        tokenForAuthentication = newuser.token;
        newuser.createdAt = Date(Date.now());
        await(newuser.save(function(err, savedUser) {
          if(err)
          {
            console.log(err);
            return res.status(200).send();
          }
        }));

        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'cloudofanonym@gmail.com',
            pass: 'l!fesucks'
          }
        });
        var mailOptions = {
          to: req.body.userMail,
          from: 'mail tester',
          subject: 'Request for registration',
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + tokenForAuthentication + '.\n' 
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          
          console.log('An e-mail has been sent to ' + req.body.userMail + ' for registration');
          return res.send(JSON.stringify({"description":"Activation link has been sent to your entered mail!!!", "status": "success"}));
        });
   }
});

//E-mail Verification
router.get('/confirmation/*',async (req, res, next) => {

  var url = req.url;
  var tokenArray = url.split("/confirmation/");
  var token = tokenArray[1];
  var myquery = { token : token};
  var newvalues = { $set : {isVerified : true}};

  console.log(tokenArray);
  console.log(token);
  User.findOne({token : token}, function(err, user){
    console.log(user);
    if(user){

      if(!user.isVerified){
        User.updateOne(myquery, newvalues, function(err, response){
        console.log("Registration Success for " + user.userMail);
        return res.status(200).send(JSON.stringify({"description":"Registration Success!!!", "status" : "success","token" : user.token}));      
        });
      }
      else{
        console.log("Email " + user.userMail + " is already registered");
        return res.status(200).send(JSON.stringify({"description":"You're already registered!..Please login", "status" : "failed"}));
      }
    }
    else{
      console.log("Invalid Link");
      return res.status(200).send(JSON.stringify({"description":"Link Expired...please try again", "status" : "failed"}));
    }
  });
});

//Login Page
router.post('/login', function(req,res){
  console.log(req.body);
  var userMail = req.body.userMail;
  var password = req.body.password;
  var myquery = { userMail : userMail};
  var newvalues = { $set : {isLogged : true}};

      User.findOne({userMail : userMail}, function(err, user){
        //console.log(user);
      if(err){
        console.log("error");
      }

      if(user){
        if(user.isVerified){
          if(user.password != password){
            console.log("Incorrect Password... Please try again!");
            return res.send(JSON.stringify({"description":"Incorrect Password... Please try again!", "status":"failed"}));
          }
          else{
            if(user.isLogged){
              console.log("Already Logged in other device!");
              return res.send(JSON.stringify({"description":"Already Logged in other device!", "status":"failed"}));
             }
            else{
              User.updateOne(myquery, newvalues, function(err, response){
              console.log("Login Success");
              sessionToken = crypto.randomBytes(16).toString('hex');
              var loginsession = new Session();
              loginsession.userMail = user.userMail;
              loginsession.firstName = user.firstName;
              loginsession.lastName  = user.lastName;
              loginsession.token = sessionToken;
              loginsession.loginTime = Date(Date.now());
              loginsession.save(function(err, savedUser) {
                if(err)
                {
                  console.log(err);
                  return res.status(200).send();
                }
              });
              return res.send(JSON.stringify({"description":"Login Successful!!!", "status" : "success", "token" : loginsession.token}));      
              });
            }
          }//
        }
        else{
          console.log(user.userMail + "Usermail is not verified");
          return res.send(JSON.stringify({"description":"Your Mail-id has not been verified yet...Please Verify", "status":"failed"}));
        }  
      }//top if closed
      else{
        console.log("User mail doesn't Exist... Create a new one!");
        return res.send(JSON.stringify({"description":"User mail doesn't Exist... Create a new one!", "status":"failed"}));
      }
    }); 
});

//Logout
router.post('/logout',function(req,res){
  var userMail = req.body.userMail;
  var loginToken = req.body.loginToken;
  var myquery = { userMail : userMail};  
  var newvalues = { $set : {isLogged : false}};

  User.findOne({userMail : userMail}, function(err, user){
    if(user){
      if(user.isLogged){
        User.updateOne(myquery, newvalues, function(err, response){
          console.log(userMail + " Succesfully logged out");
          let loginquery = {token : loginToken};
          let logoutTime = { $set : {logoutTime : Date(Date.now())}};
          Session.updateOne(loginquery,logoutTime,function(err,response){
            if(err) console.log(err);
          });
          return res.status(200).send(JSON.stringify({"description":"Succesfully logged out!", "status":"success"}));
      });
    }
    else{
        console.log(userMail + " was not logged in");
        return res.status(404).send(JSON.stringify({"description":"You're not logged in...!", "status":"failed"}));
    }
  }
  else{
    console.log(userMail + " is not a registered user");
    return res.status(404).send(JSON.stringify({"description":"You're not a registered user...please register!", "status":"failed"}));
  }
});

});

//Forgot password
router.post('/forgotPassword', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ userMail: req.body.userMail }, function(err, user) {
        if (!user) {
          console.log('No account with that email address exists.');
          return res.send(JSON.stringify({"description":"Mail-Id doesn't exist...Create a new one!","status" : "failed"}));
         // return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'cloudofanonym@gmail.com',
          pass: 'l!fesucks'
        }
      });
      var mailOptions = {
        to: req.body.userMail,
        from: 'mail tester',
        subject: 'Node.js Password Reset',
        text : 'Your Password is \"' + user.password + '\"'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        
        console.log('Password has been sent to ' + req.body.userMail + ' with further instructions.');
        return res.send(JSON.stringify({"description":"Password has been sent to your registered mail!!!", "status" : "success"}));
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

//Add Channel and video info
router.post('/home/add/channelVideos',function(req,res){

  var channel_name = req.body.channelName;
  var channel_id   = req.body.channelId;
  var videos_id    = req.body.videoIds;
  var time         = req.body.currentTime;
  var date         = req.body.currentDate;
  var video_titles = req.body.videoTitles;
 // console.log(req.body);
  Channel.findOne({channelId : channel_id}, function(err, user){
    if(user){
      Channel.updateOne({channelId : channel_id},{$addToSet: {videosId : videos_id}, currentDate:date, currentTime:time} ,function(err, response) {
        if (err) throw err;
        console.log(Channel.channelName + " Videos Added successfully");
        return res.status(200).send(JSON.stringify ({"description": "Videos appended to" + Channel.channelName + " successfully","status":"success"}));
      });
    }
    else{
      var newChannel = new Channel();

      newChannel.channelId = channel_id;
      newChannel.videoIds = videos_id;
      newChannel.currentDate = date;
      newChannel.currentTime = time;
      newChannel.channelName = channel_name;
      newChannel.videoTitles = video_titles;
      newChannel.save();
      console.log(channel_name + " Created successfully");
      return res.status(200).send(JSON.stringify ({"description":channel_name + " Channel Created successfully","status":"success"}));
    }
  });
});

//Remove video Info
router.post('/home/remove/videos',function(req,res){

  var channel_id = req.body.channel;
  var videos_id = req.body.videos;
    Channel.findOne({channelId : channel_id}, function(err, user){
      if(user){
        var invalid_elements = _.difference(videos_id,user.videosId);
        if(invalid_elements)
        {
          console.log("invalid elements found--> "+invalid_elements);
          return res.status(404).send(JSON.stringify ({"description":"invalid elements found--> "+ invalid_elements,"status":"failure"}));
        }
        else{
          Channel.update({channelId : channel_id},{$pullAll: {videosId : videos_id}},function(err, response) {
            if (err) throw err;
            console.log("Videos deleted successfully");
            if(response.nModified)
            return res.status(200).send(JSON.stringify ({"description":"Videos deleted successfully","status":"success"}));
        });        
        }
      }
      else{
        return res.status(404).send(JSON.stringify ({"description":"Channel doesn't exist","status":"failure"}));
      }
    });
});

//Remove Channel
router.post('/home/remove/channel',function(req,res){

  var channel_id = req.body.channel;
    Channel.findOne({channelId : channel_id}, function(err, channel){
      if(channel){
        Channel.deleteOne({userMail:userMail},function(err,obj){
          if(err) throw err;
          console.log(Channel.channelName + " channel deleted successfully");
          return res.status(200).send(JSON.stringify({"description":"Channel Deleted Successfully","status":"success"}));
        });
      }
      else
      return res.status(404).send(JSON.stringify({"description":"Channel doesn't exist","status":"failure"}));
    });
});

//Remove a registered user
router.post('/remove-user',function(req,res){
  var userMail = req.body.userMail;
  User.findOne({userMail:userMail},function(err,user){
    if(user){
      User.deleteOne({userMail:userMail},function(err,obj){
        if(err) throw err;
        console.log(userMail + " deleted successfully");
        return res.status(200).send(JSON.stringify({"description":"User Info Deleted Successfully","status":"success"}));
      });
    }
    else
    console.log(userMail + " doesn't exist to remove");
    return res.status(404).send(JSON.stringify({"description":"Usermail doesn't exist","status":"failure"}));
  });
});

//Get the details about the channels and videos
router.get('/home/getVideos', function(req, res) {
  var usersProjection = { 
    __v: false,
    _id: false,
    currentTime : false,
    currentDate : false
  };

  Channel.find({}, usersProjection, function (err, channel) {
      if (err) return next(err);
      console.log("Get Video request processed successfully");
      return res.status(200).send(JSON.stringify(channel));
  }); 
});

//to get admin details
router.get('/home/accountInformation/getAdminDetails',function(req,res){
  //Temporarily for Single admin only
  console.log("Inside func");
  var usersProjection = { 
    __v: false,
    _id: false,
    isLogged : false,
    isVerified : false,
    token : false, //Not needed for multiple admins
    createdAt : false,
    password : false
  };

  User.find({}, usersProjection, function (err, admin) {
      if (err) return next(err);
      console.log("Get Admin details request processed successfully");
      return res.status(200).send(JSON.stringify(admin));
  }); 
});

//to get feedback from user
router.get('/home/user/feedback',function(req,res){
  var userMail = req.body.userMail;
  var feedback = req.body.feedback; 

  var new_feedback = new Feedback();

  new_feedback.userMail = userMail;
  new_feedback.feedback = feedback;
  new_feedback.givenTime = Date(Date.now());
  new_feedback.save();
  console.log("Feedback saved successfully");

  return res.status(200).send(JSON.stringify({"description":"Feedback has been sent successfully","status":"success"}));
});

//to send the feedback
router.get('/home/user/getFeedback', function(req, res) {
  var usersProjection = { 
    __v: false,
    _id: false
  };

  Feedback.find({}, usersProjection, function (err, feedback) {
      if (err) return next(err);
      console.log("Feedbacks sent successfully");
      return res.status(200).send(JSON.stringify(feedback));
  }); 
});
module.exports = router;
