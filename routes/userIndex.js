var express = require('express');
var userRouter = express.Router();
var User = require('../lib/userSchema');
var userSession = require('../lib/userSessionSchema');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var _ = require('underscore');
var dotenv = require('dotenv');
dotenv.config();
var firstName, lastName, userMail, password, gender, mobileNo, sessionToken ;

//Register page
userRouter.post('/user/register',async(req,res) =>{
  try{
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
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD
          }
        });
        var mailOptions = {
          to: req.body.userMail,
          subject: 'Request for registration',
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/user/confirmation\/' + tokenForAuthentication + '\n' 
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
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD
          }
        });
        var mailOptions = {
          to: req.body.userMail,
          subject: 'Request for registration',
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/user/confirmation\/' + tokenForAuthentication + '\n' 
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          
          console.log('An e-mail has been sent to ' + req.body.userMail + ' for registration');
          return res.send(JSON.stringify({"description":"Activation link has been sent to your entered mail!!!", "status": "success"}));
        });
   }
  }
  catch(err){
    console.log(err);
    return res.status(500).send(err);
  }
});

//E-mail Verification
userRouter.get('/user/confirmation/*',async (req, res, next) => {
try{
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
        return res.sendFile('./html/register-success.html', {root: __dirname });
        //return res.status(200).send(JSON.stringify({"description":"Registration Success!!!", "status" : "success","token" : user.token}));      
        });
      }
      else{
        console.log("Email " + user.userMail + " is already registered");
        return res.sendFile('./html/register-success.html', {root: __dirname });
       // return res.sendFile('./html/already-register.html', {root: __dirname });
        //return res.status(200).send(JSON.stringify({"description":"You're already registered!..Please login", "status" : "failed"}));
      }
    }
    else{
      console.log("Invalid Link");
      return res.status(200).send(JSON.stringify({"description":"Link Expired...please try again", "status" : "failed"}));
    }
  });
}
catch(err){
  console.log(err);
  return res.status(500).send(err);
}
});

//Login Page
userRouter.post('/user/login', function(req,res){
  try{
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
              var loginsession = new userSession();
              loginsession.userMail = user.userMail;
              loginsession.firstName = user.firstName;
              loginsession.lastName  = user.lastName;
              loginsession.loginToken = sessionToken;
              loginsession.loginTime = Date(Date.now());
              loginsession.save(function(err, savedUser) {
                if(err)
                {
                  console.log(err);
                  return res.status(500).send();
                }
              });
              return res.send(JSON.stringify({"description":"Login Successful!!!", "status" : "success", "token" : loginsession.loginToken}));      
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
  }
  catch(err){
    console.log(err);
    return res.status(500).send(err);
  }
});

//Logout
userRouter.post('/user/logout',function(req,res){
  try{
  var userMail = req.body.userMail;
  var loginToken = req.body.loginToken;
  var myquery = { userMail : userMail};  
  var newvalues = { $set : {isLogged : false}};

  User.findOne({userMail : userMail}, function(err, user){
    if(user){
      if(user.isLogged){
        User.updateOne(myquery, newvalues, function(err, response){
          console.log(userMail + " Succesfully logged out");
          let loginquery = {loginToken : loginToken};
          let logoutTime = { $set : {logoutTime : Date(Date.now())}};
          userSession.updateOne(loginquery,logoutTime,function(err,response){
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
}
catch(err){
  console.log(err);
  return res.status(500).send(err);
}
});

//Forgot password
userRouter.post('/user/forgotPassword', function(req, res, next) {
  try{
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
          user: process.env.MAILER_EMAIL,
          pass: process.env.MAILER_PASSWORD
        }
      });
      var mailOptions = {
        to: req.body.userMail,
        subject: 'User Password',
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
}
catch(err){
  console.log(err);
  return res.status(500).send(err);
}
});

//Change Password Authentication
userRouter.post('/user/changePassword',function(req,res){
  console.log(req.body);
  var myquery = { userMail : req.body.userMail};
  var changePwdToken = crypto.randomBytes(16).toString('hex');
  var newvalues = { $set : {changePasswordToken : changePwdToken}};
  User.findOne({ userMail: req.body.userMail }, function(err, user) {
    if(user){
      if(user.password == req.body.oldPassword){
        User.updateOne(myquery, newvalues, function(err, response){
          return res.status(200).send(JSON.stringify({"description" : "Verified Successfully","status":"success" , "token" : changePwdToken}));  
        });
      }
      else{
        return res.status(400).send(JSON.stringify({"description" : "Verification failed...Please try again..!","status":"failed"}));  
      }
    }
    else{
      return res.status(404).send(JSON.stringify({"description" : "Usermail doesn't exist","status":"failed"}));
    }
  });
});

//Change Password Implementation
userRouter.post('/user/newPassword',function(req,res){
  console.log(req.body);
  var myquery = { changePasswordToken : req.body.changePasswordToken};
  var newvalues = { $set : {password : req.body.newPassword}};
  User.findOneAndUpdate(myquery, newvalues, function(err, response){
    if(response){ 
      console.log("Password updated successfully");
      return res.status(200).send(JSON.stringify({"description" : "Your Password updated successfully","status":"success"}));
    }
    return res.status(400).send(JSON.stringify({"description" : "You can't directly enter new password","status":"failed"}));
  });
});

module.exports = userRouter;