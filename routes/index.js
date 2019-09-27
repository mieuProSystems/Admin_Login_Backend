//Dependencies
const express = require('express');
const router = express.Router();
var User = require('../lib/User');
var Session = require('../lib/Session');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var demomail = "cloudofanonym@gmail.com"
var key = "w0rldsucks";

//Variable to Store the data coming from frontend
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

   //Checking whether the mail-id exist or not
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
        //For Sending the e-mail
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: demomail,
            pass: key
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
          user: demomail,
          pass: key
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
});//End of registration

//API for confirmation to register the e-mail
router.get('/confirmation/*',async (req, res, next) => {

  var url = req.url;
  var tokenArray = url.split("/confirmation/");
  var token = tokenArray[1];
  var myquery = { token : token};
  var newvalues = { $set : {isVerified : true}};

  User.findOne({token : token}, function(err, user){
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
});//End of Confirmation


//Login Page
router.post('/login', function(req,res){
  console.log(req.body);
  var userMail = req.body.userMail;
  var password = req.body.password;
  var myquery = { userMail : userMail};
  var newvalues = { $set : {isLogged : true}};

  User.findOne({userMail : userMail}, function(err, user){
  if(err){
    console.log(err);
  }
  //If User exists
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
      //If Registered mail-id is not verified 
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
});//End of Login API


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
});//End of Logout


//Forgot password
router.post('/forgot', function(req, res, next) {
  User.findOne({ userMail: req.body.userMail }, function(err, user) {
    if (!user) {
      console.log('No account with that email address exists.');
      return res.send(JSON.stringify({"description":"Mail-Id doesn't exist...Create a new one!","status" : "failed"}));
    }
    var smtpTransport = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: demomail,
        pass: key
      }
    });
    var mailOptions = {
      to: req.body.userMail,
      from: 'mail tester',
      subject: 'Request for Password Reset',
      text : 'Your Password is \"' + user.password + '\"'
    };
    smtpTransport.sendMail(mailOptions, function(err) { 
      console.log('Password has been sent to ' + req.body.userMail + ' with further instructions.');
      return res.send(JSON.stringify({"description":"Password has been sent to your registered mail!!!", "status" : "success"}));
    });
  });
});


module.exports = router;
