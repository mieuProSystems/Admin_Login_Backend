const express = require('express');
const Jwt = require('jsonwebtoken');
const UserCredentials = require('../datamodels/user_credentials');
const mailVerification = require('../send_verification_mail');
const router = express.Router();
var kickbox = require('kickbox').client(process.env.KICKBOX_API_KEY).kickbox();

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

//handle email registration
router.post('/user/register', async function (request, response, next) {

  console.log(request.body);
  //check email already exists
  const email_exists = await UserCredentials.findOne({
    email: request.body.email
  });
  if (email_exists) {
    return response.status(400).json({
      message: 'Email already Exists',
      status: 'failure'
    });
  }
  request.body.username = toTitleCase(request.body.username);
  //check the username already exists
  const username_exists = await UserCredentials.findOne({
    username: request.body.username
  });
  if (username_exists) {
    return response.status(400).json({
      message: 'Username already Exists',
      status: 'failure'
    });
  }
  kickbox.verify(request.body.email, async function (err, res) {
    var validMail = res.body.result;
    if (validMail === 'undeliverable') {
      console.log("Register-- mail-id is invalid " + request.body.email);
      return response.send(JSON.stringify({
        message: "Email you entered doesn't exist...Enter a valid one",
        status: "failure"
      }));
    } else if (validMail === 'risky') {
      console.log("Register-- mail-id is Temporary mail " + request.body.email);
      return response.send(JSON.stringify({
        message: "Don't enter Temporary mail-ids...Enter a valid one",
        status: "failure"
      }));
    } else if (validMail === 'deliverable') {
      //generate user id
      request.body.userId = 'user' + Math.random().toString(36).substr(2, 6);
      //generate user token
      request.body.token = Jwt.sign({
        id: request.body.userId
      }, process.env.TOKEN_SECRET);
      //create a new user
      const user_credits = new UserCredentials(request.body);
      try {
        await user_credits.save();
        //send account verification email
        mailVerification.verifyMail(request.body.userId, request.body.email, request.headers.host);
        return response.status(200).json({
          token: request.body.token,
          status: 'success'
        })
      } catch (error) {
        return response.status(400).send(error);
      }
    }
  });
});

//login function
router.post('/user/login', async function (request, response) {

  //check user exists
  const user = await UserCredentials.findOne({
    email: request.body.email
  });
  if (!user) {
    return response.status(400).json({
      message: 'invalid username',
      status: 0
    });
  }
  //check password
  if (request.body.password.localeCompare(user.password)) {
    return response.status(400).json({
      message: 'incorrect password',
      status: 1
    });
  }
  //when password is valid
  //if token doesn't exists
  if (user.token === '') {
    //generate token
    const token = Jwt.sign({
      id: user.userId
    }, process.env.TOKEN_SECRET);
    const result = await UserCredentials.findOneAndUpdate({
      'email': request.body.email
    }, {
      'token': token
    }, {
      new: true
    });
    return response.json({
      'token': result.token,
      'status': 2
    })
  }
  //if token already exists
  if (user.isVerified) {
    console.log(request.connection.remoteAddress);
    console.log(user.username + " Logged in");
    return response.send(JSON.stringify({
      'token': user.token,
      'status': 2
    }));
  } else {
    console.log("mail has not been verified");
    return response.send(JSON.stringify({
      message: 'Mail-id has not been verified yet',
      status: 3
    }));
  }
});

//logout function
router.post('/user/logout', async function (request, response) {

  //validate token
  try {
    //decode token to find the user id
    const decoded = Jwt.verify(request.get('token'), process.env.SECRET);
    const user = await UserCredentials.findOne({
      user_id: decoded.id
    });
    if (user) {
      //update token value to null
      const result = await UserCredentials.findOneAndUpdate({
        email: user.email
      }, {
        token: ''
      });
      return response.status(200).json({
        message: 'logged out',
        status: 'success'
      });
    } else {
      return response.status(400).json({
        message: 'invalid token',
        status: 'failure'
      });
    }
  } catch (e) {
    //console.log(e.message);
    return response.status(400).json({
      message: 'invalid token',
      status: 'failure'
    });
  }

});

//to get user profile
router.post('/user/accountInformation',function(req,res){
  var userToken = req.body.token;
  
  try {
    var usersProjection = {
    __v: false,
    _id: false,
    registrationMethod: false,
    token: false,
    isVerified : false,
    };

    UserCredentials.findOne({token : userToken}, usersProjection).exec(function (err, user) {
    if (err) return next(err);
    console.log("Get profile details request for " + user.username + "  processed");
    return res.status(200).send(JSON.stringify(user));
    });
} catch (err) {
    console.log(err);
    return res.status(500).send(err);
}
});

module.exports = router;