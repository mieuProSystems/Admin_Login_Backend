var express = require('express');
var userRouter = express.Router();
var UserCredentials = require('../datamodels/user_credentials');

//To get details of users registered through App
userRouter.get('/home/admin/getUserDetails',function(req,res){
    try {
      var usersProjection = {
        __v: false,
        _id: false,
        registrationMethod: false,
        //isVerified : false,
        password : false,
        token: false,
        userId : false
      };
  
      UserCredentials.find({}, usersProjection).sort('username').exec(function (err, user) {
        if (err) return next(err);
        console.log("Get User Details processed successfully ");
        return res.status(200).send(JSON.stringify(user));
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send(err);
    }
  });
  
  //To delete a user registered through App
  userRouter.post('/home/admin/removeUser',function(req,res){
    try {
      var user_mail = req.body.userMail;
      UserCredentials.findOneAndDelete({
        email : user_mail
      }, function (err, user) {
        if (err) throw err;
        if (user) {
            console.log(user_mail + " removed successfully from App Database");
            return res.status(200).send(JSON.stringify({
              "description": "User Info Removed Successfully",
              "status": "success"
            }));
        } else {
          console.log(user_mail + " doesn't exist to remove");
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

  module.exports = userRouter;