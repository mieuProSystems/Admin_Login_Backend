const express = require('express');
const Jwt = require('jsonwebtoken');
const UserCredentials = require('../datamodels/user_credentials');
const mailVerification = require('../send_verification_mail');
const router = express.Router();

//handle email registration
router.post('/register', async function (request, response, next) {
    console.log(request.body);
    //check the type of registration
    /* if (request.body.registration_method === 'google') {
         next('route');
     } */
    //check email already exists
    const email_exists = await UserCredentials.findOne({email: request.body.email});
    if (email_exists) {
        return response.status(400).json({
            message: 'Email already Exists',
            status: 'failure'
        });
    }
    //check the username already exists
    const username_exists = await UserCredentials.findOne({username: request.body.username});
    if (username_exists) {
        return response.status(400).json({
            message: 'Username already Exists',
            status: 'failure'
        });
    }
    //generate user id
    request.body.userId = 'user' + Math.random().toString(36).substr(2, 6);
    //generate user token
    request.body.token = Jwt.sign({id: request.body.userId}, process.env.TOKEN_SECRET);
    //create a new user
    const user_credits = new UserCredentials(request.body);
    try {
        await user_credits.save();
        //send account verification email
        // mailVerification.verifyMail(request.body.userId, request.body.email, request.headers.host);
        return response.status(200).json({
            token: request.body.token,
            status: 'success'
        })
    } catch (error) {
        return response.status(400).send(error);
    }
});

//login function
router.post('/login', async function (request, response) {

    //check user exists
    const user = await UserCredentials.findOne({email: request.body.email});
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
        const token = Jwt.sign({id: user.userId}, process.env.TOKEN_SECRET);
        const result = await UserCredentials.findOneAndUpdate(
            {'email': request.body.email},
            {'token': token},
            {new: true}
        );
        return response.json(
            {
                'token': result.token,
                'status': 2
            }
        )
    }
    //if token already exists
    return response.json(
        {
            'token': user.token,
            'status': 2
        }
    )
});

//logout function
router.post('/logout', async function (request, response) {

    //validate token
    try {
        //decode token to find the user id
        const decoded = Jwt.verify(request.get('token'), process.env.SECRET);
        const user = await UserCredentials.findOne({user_id: decoded.id});
        if (user) {
            //update token value to null
            const result = await UserCredentials.findOneAndUpdate(
                {email: user.email},
                {token: ''}
            );
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


module.exports = router;