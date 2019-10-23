const router = require('express').Router();
const UserCredentials = require('../datamodels/user_credentials');
const mailVerification = require('../datamodels/mail_verification_token');


router.get('/user/confirm/:id', async function (request, response) {

    mailVerification.findOneAndDelete({token: request.params.id}, function (err, user) {
        if (err) {
            console.log(err);
            return response.json({
                status: 'failure',
                message: 'invalid link'
            })
        }
        UserCredentials.findOneAndUpdate({userId: user.userId}, {isVerified: true}, function (err) {
            if (err) {
                console.log(err);
            }
            return response.json({
                status: 'success',
                message: 'email verified'
            })
        });
    });
});

router.post('/user/verify/email', async function (request, response) {
    isExists = await UserCredentials.findOne({email: request.body.email});
    console.log(request.body);
    console.log(isExists);
    if (isExists) {
        return response.status(400).json({
            message: 'Email already Exists',
            status: 'failure'
        });
    } else {
        return response.status(200).json({
            message: 'valid email',
            status: 'success'
        });
    }
});

router.post('/user/verify/uname', async function (request, response) {
    isExists = await UserCredentials.findOne({username: request.body.uname});
    if (isExists) {
        return response.status(400).json({
            message: 'username already Exists',
            status: 'failure'
        });
    } else {
        return response.status(200).json({
            message: 'valid username',
            status: 'success'
        });
    }
});

module.exports = router;