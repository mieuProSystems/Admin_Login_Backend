var express = require('express');
var adminRouter = express.Router();
var Admin = require('../lib/adminSchema');
var adminSession = require('../lib/adminSessionSchema');
var async = require('async');
var nodemailer = require('nodemailer');
var dotenv = require('dotenv');
var crypto = require('crypto');
var moment = require('moment-timezone');
var kickbox = require('kickbox').client('live_9578ccacf704f813f66f0aa075e210c7b88835458d7a793065adde401dcca649').kickbox();
dotenv.config();
var firstName, lastName, userMail, password, gender, mobileNo, sessionToken;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

//Register page
adminRouter.post('/admin/register', async (req, res) => {
  try {
    req.body.firstName = toTitleCase(req.body.firstName);
    firstName = req.body.firstName;
    lastName = req.body.lastName;
    gender = req.body.gender;
    userMail = req.body.userMail;
    password = req.body.password;
    mobileNo = req.body.mobileNo;

    var tokenForAuthentication;
    var newuser = new Admin();

    let admin = await Admin.findOne({
      userMail: req.body.userMail
    });

    if (admin) { //Checks whether mail exist      
      if (admin.isVerified) { //If exist and verified
        console.log('Usermail ' + req.body.userMail + ' already exists');
        return res.send(JSON.stringify({
          "description": "Your email is already registered...Please login",
          "status": "failed"
        }));
      } else { //If exist but not verified
        let myquery = {
          userMail: admin.userMail
        };

        let newvalues = {
          $set: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            password: req.body.password,
            mobileNo: req.body.mobileNo,
            createdAt: Date(Date.now())
          }
        };

        Admin.updateOne(myquery, newvalues, function (err, response) {
          if (err) {
            console.log(err);
          }
        });

        tokenForAuthentication = admin.token;
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
          text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/admin/confirmation\/' + tokenForAuthentication
        };

        smtpTransport.sendMail(mailOptions, async function (err) {
          if (err) {
            return res.send(JSON.stringify({
              "description": "Invalid mail Id",
              "status": "failed"
            }));
          }
          console.log('An e-mail has been sent to ' + req.body.userMail + ' for registration');
          return res.send(JSON.stringify({
            "description": "Your request has not been verified yet...Activation link has been sent to your entered mail again!!!",
            "status": "success"
          }));
        });
      }
    } else { //if it is a new mail-id
      kickbox.verify(req.body.userMail, async function (err, response) {
        var validMail = response.body.result;
        if (validMail === 'undeliverable') {
          console.log("Register-- mail-id is invalid " + req.body.userMail);
          return res.send(JSON.stringify({
            "description": "Email you entered doesn't exist...Enter a valid email-id",
            "status": "failed"
          }));
        } else if (validMail === 'risky') {
          console.log("Register-- mail-id is Temporary mail " + req.body.userMail);
          return res.send(JSON.stringify({
            "description": "Don't enter Temporary mail-ids...Enter a valid one",
            "status": "failed"
          }));
        } else if (validMail === 'deliverable') {
          newuser.firstName = firstName;
          newuser.lastName = lastName;
          newuser.gender = gender;
          newuser.userMail = userMail;
          newuser.password = password;
          newuser.mobileNo = mobileNo;
          newuser.token = crypto.randomBytes(16).toString('hex');
          tokenForAuthentication = newuser.token;
          newuser.createdAt = Date(Date.now());
          await (newuser.save(function (err, savedUser) {
            if (err) {
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
            text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/admin/confirmation\/' + tokenForAuthentication,
          };
          smtpTransport.sendMail(mailOptions, async function (err, info) {
            console.log('An e-mail has been sent to ' + req.body.userMail + ' for registration');
            return res.send(JSON.stringify({
              "description": "Activation link has been sent to your entered mail!!!",
              "status": "success"
            }));
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//E-mail Verification
adminRouter.get('/admin/confirmation/*', async (req, res, next) => {
  try {
    var url = req.url;
    var tokenArray = url.split("/confirmation/");
    var token = tokenArray[1];
    var myquery = {
      token: token
    };
    var newvalues = {
      $set: {
        isVerified: true
      }
    };

    console.log(tokenArray);
    console.log(token);
    Admin.findOne({
      token: token //Checking whether it is a valid token
    }, function (err, admin) {
      console.log(admin);
      if (admin) { //If it is a valid token
        if (!admin.isVerified) { //And hasn't been verified yet
          Admin.updateOne(myquery, newvalues, function (err, response) {
            console.log("Registration Success for " + admin.userMail);
            return res.sendFile('./html/register-success.html', {
              root: __dirname
            });
          });
        } else { //If it's been verified already
          console.log("Email " + admin.userMail + " is already registered");
          return res.sendFile('./html/already-register.html', {
            root: __dirname
          });
        }
      } else { //If it is not a valid token
        console.log("Invalid Link");
        return res.status(200).send(JSON.stringify({
          "description": "Link Expired...please try again",
          "status": "failed"
        }));
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Login Page
adminRouter.post('/admin/login', function (req, res) {
  try {
    console.log(req.body);
    var userMail = req.body.userMail;
    var password = req.body.password;
    var myquery = {
      userMail: userMail
    };
    var newvalues = {
      $set: {
        isLogged: true
      }
    };

    Admin.findOne({
      userMail: userMail //Checking whether mail-id exist
    }, function (err, admin) {
      if (err) {
        console.log("error");
      }

      if (admin) { //If account exists
        if (admin.isVerified) { //and verified
          if (admin.password != password) { //If passwords don't match
            console.log("Incorrect Password... Please try again!");
            return res.send(JSON.stringify({
              "description": "Incorrect Password... Please try again!",
              "status": "failed"
            }));
          } else { //If passwords match
            if (admin.isLogged) { //But already signed in
              console.log("Already Logged in other device!");
              return res.send(JSON.stringify({
                "description": "Already Logged in other device!",
                "status": "failed"
              }));
            } else {
              Admin.updateOne(myquery, newvalues, function (err, response) {
                console.log("Login Success for " + admin.userMail);
                sessionToken = crypto.randomBytes(16).toString('hex');
                var loginsession = new adminSession(); //Creating Session Log
                loginsession.userMail = admin.userMail;
                loginsession.firstName = admin.firstName;
                loginsession.lastName = admin.lastName;
                loginsession.loginToken = sessionToken;
                loginsession.loginTime = moment().utcOffset("+05:30").format('DD/MM/YYYY, HH:mm:ss');
                loginsession.save(function (err, savedUser) {
                  if (err) {
                    console.log(err);
                    return res.status(500).send();
                  }
                });
                return res.send(JSON.stringify({
                  "description": "Login Successful!!!",
                  "status": "success",
                  "token": loginsession.loginToken
                }));
              });
            }
          } //
        } else {
          console.log(admin.userMail + " is not verified");
          return res.send(JSON.stringify({
            "description": "Your Mail-id has not been verified yet...Please Verify",
            "status": "failed"
          }));
        }
      } //top if closed
      else {
        console.log("Admin mail doesn't Exist... Create a new one!");
        return res.send(JSON.stringify({
          "description": "Admin mail doesn't Exist... Create a new one!",
          "status": "failed"
        }));
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Logout
adminRouter.post('/admin/logout', function (req, res) {
  try {
    var loginToken = req.body.loginToken;
    var newvalues = {
      $set: {
        isLogged: false
      }
    };
    adminSession.findOne({
      loginToken: loginToken //Checking whether token is vaild
    }, function (err, session) {
      Admin.findOne({
        userMail: session.userMail
      }, function (err, admin) {
        if (admin) { //If account exists
          if (admin.isLogged) { //And logged in
            var myquery = {
              userMail: session.userMail
            };
            Admin.updateOne(myquery, newvalues, function (err, response) {
              console.log(session.userMail + " Succesfully logged out");
              let loginquery = {
                loginToken: loginToken
              };
              let logoutTime = {
                $set: {
                  logoutTime: moment().utcOffset("+05:30").format('DD/MM/YYYY, HH:mm:ss')
                }
              };
              adminSession.updateOne(loginquery, logoutTime, function (err, response) {
                if (err) console.log(err);
                else {
                  return res.status(200).send(JSON.stringify({
                    "description": "Succesfully logged out!",
                    "status": "success"
                  }));
                }
              });
            });
          } else {
            console.log(session.userMail + " was not logged in");
            return res.send(JSON.stringify({
              "description": "You're not logged in...!",
              "status": "failed"
            }));
          }
        } else { //if account doesn't exist 
          console.log(session.userMail + " is not a registered admin");
          return res.send(JSON.stringify({
            "description": "You're not a registered admin...Please register!",
            "status": "failed"
          }));
        }
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Forgot password
adminRouter.post('/admin/forgotPassword', function (req, res, next) {
  try {
    async.waterfall([ // to run an array of functions in series
      function (done) { //Creating Token
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) { //Passing the token to the next function
        Admin.findOne({
          userMail: req.body.userMail
        }, function (err, admin) {
          //console.log(admin);
          if (!admin) {
            console.log("Mail-Id doesn't exist...Create a new one!");
            return res.send(JSON.stringify({
              "description": "Mail-Id doesn't exist...Create a new one!",
              "status": "failed"
            }));
          }
          else{
            var smtpTransport = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                user: process.env.MAILER_EMAIL,
                pass: process.env.MAILER_PASSWORD
              }
            });
            var mailOptions = {
              to: req.body.userMail,
              subject: 'Admin Password',
              text: 'Your Password is \"' + admin.password + '\"'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
    
              console.log('Password has been sent to ' + req.body.userMail + ' with further instructions.');
              return res.send(JSON.stringify({
                "description": "Password has been sent to your registered mail!!!",
                "status": "success"
              }));
            });
          }
        });
      }
    ], function (err) {
      if (err) return next(err);
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Change Password Authentication
adminRouter.post('/admin/changePassword', function (req, res) {
  try {
    console.log(req.body);
    var myquery = {
      userMail: req.body.userMail
    };
    var changePwdToken = crypto.randomBytes(16).toString('hex');
    var newvalues = {
      $set: {
        changePasswordToken: changePwdToken
      }
    };
    Admin.findOne({
      userMail: req.body.userMail
    }, function (err, admin) {
      if (admin) {
        if (admin.password == req.body.oldPassword) {
          Admin.updateOne(myquery, newvalues, function (err, response) {
            return res.status(200).send(JSON.stringify({
              "description": "Verified Successfully",
              "status": "success",
              "token": changePwdToken
            }));
          });
        } else {
          return res.status(400).send(JSON.stringify({
            "description": "Verification failed...Please try again..!",
            "status": "failed"
          }));
        }
      } else {
        return res.send(JSON.stringify({
          "description": "Usermail doesn't exist",
          "status": "failed"
        }));
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Change Password Implementation
adminRouter.post('/admin/newPassword', function (req, res) {
  try {
    var myquery = {
      changePasswordToken: req.body.changePasswordToken
    };
    var newvalues = {
      $set: {
        password: req.body.newPassword
      }
    };
    Admin.findOne({
      changePasswordToken: req.body.changePasswordToken
    }, function (err, admin) {
      if (admin) {
        if (admin.password === req.body.newPassword) {
          return res.status(200).send(JSON.stringify({
            "description": "No change in the password...Enter a new One",
            "status": "failed"
          }));
        } else {
          Admin.findOneAndUpdate(myquery, newvalues, function (err, response) {
            if (response) {
              console.log("Password updated successfully");
              return res.status(200).send(JSON.stringify({
                "description": "Your Password updated successfully",
                "status": "success"
              }));
            }
            return res.status(400).send(JSON.stringify({
              "description": "You can't directly enter new password",
              "status": "failed"
            }));
          });
        }
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//Remove a registered admin
adminRouter.post('/home/admin/removeAdmin', function (req, res) {
  try {
    var user_mail = req.body.userMail;
    Admin.findOne({
      userMail: user_mail
    }, function (err, admin) {
      if (admin) {
        if (admin.isLogged) {
          console.log(user_mail + " is logged in...You can't remove this account right now");
          return res.send(JSON.stringify({
            "description": user_mail + " is logged in...You can't remove this account right now",
            "status": "failed"
          }));
        } else {
          Admin.deleteOne({
            userMail: user_mail
          }, function (err, obj) {
            if (err) throw err;
            console.log(user_mail + " removed successfully");
            return res.status(200).send(JSON.stringify({
              "description": user_mail + " Admin Account removed Successfully",
              "status": "success"
            }));
          });
        }
      } else {
        console.log(user_mail + " doesn't exist...please refresh the page");
        return res.send(JSON.stringify({
          "description": user_mail + " doesn't exist...please refresh the page",
          "status": "failed"
        }));
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//to get admin details
adminRouter.post('/home/myProfile/getDetails', function (req, res) {
  try {
    var loginToken = req.body.loginToken;
    //Temporarily for Single admin only
    var usersProjection = {
      __v: false,
      _id: false,
      isLogged: false,
      isVerified: false,
      token: false, //Not needed for multiple admins
      createdAt: false,
      password: false,
      changePasswordToken: false
    };

    adminSession.findOne({
      loginToken: loginToken
    }, function (err, session) {
      if(session){
      Admin.findOne({
        userMail: session.userMail
      }, usersProjection, function (err, admin) {
        console.log("Get Profile request processed");
        return res.status(200).send(JSON.stringify(admin));
      });
    }
    else{
      console.log("Something went wrong on getting Admin profile")
      return res.status(200).send(JSON.stringify({'description': 'Something went wrong on getting your profile','status':'failed'}));
    }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//To get login sessions
adminRouter.get('/admin/getLoginSessions', function (req, res) {
  try {
    var usersProjection = {
      __v: false,
      _id: false,
      loginToken: false
    };

    adminSession.find({
      // userMail: req.body.userMail
    }, usersProjection).sort('-loginTime').exec(function (err, session) {
      if (err) return next(err);
      console.log("Get Sessions request processed");
      if (session)
        return res.status(200).send(JSON.stringify(session));
      else
        return res.status(200).send(JSON.stringify({"description":"Something went wrong in getting Login Sessions","status":"failed"}));
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//To get details about all admins
adminRouter.get('/home/admin/getAdminDetails', function (req, res) {
  try {
    //Temporarily for Single admin only
    var usersProjection = {
      __v: false,
      _id: false,
      //isLogged: false,
      isVerified: false,
      token: false, //Not needed for multiple admins
      gender: false,
      createdAt: false,
      password: false,
      changePasswordToken: false
    };

    Admin.find({}, usersProjection, function (err, admin) {
      if (err) return next(err);
      console.log("Get Admin details request processed");
      //console.log(admin);
      return res.status(200).send(JSON.stringify(admin));
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

module.exports = adminRouter;
