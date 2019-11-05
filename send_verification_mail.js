const mailer = require('nodemailer');
const Jwt = require('jsonwebtoken');
const verificationToken = require('./datamodels/mail_verification_token');
const dotenv = require('dotenv');
dotenv.config();

var sendVerificationMail = function (userId, email, redirect_host) {

  //generate verification token
  token = Jwt.sign({
    id: userId
  }, process.env.VERIFICATION_MAIL_SECRET);

  //create verification token entry
  var verification_Token = new verificationToken({
    token: token,
    userId: userId,
    email: email
  });

  //create the verification link
  var url = 'http://' + redirect_host + '/user/confirm/' + token;

  //create mail details
  const mailDetails = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: 'Confirm your Email Address',
    html: `Please click the link to confirm your Email \n <a href="${url}">${url}</a>`
  };

  // create mail transporter
  const transporter = mailer.createTransport({
    service: process.env.MAIL_SERIVCE,
    secure: true,
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_PASSWORD
    }
  });

  transporter.sendMail(mailDetails, function (err, res) {
    if (err) {
      console.log(err);
    } else {
      verificationToken.findOneAndUpdate({
        userId: userId
      }, verification_Token, {
        upsert: true
      }, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('mail sent successfully');
        }
      });
    }
  });
};

module.exports = {
  verifyMail: sendVerificationMail
};