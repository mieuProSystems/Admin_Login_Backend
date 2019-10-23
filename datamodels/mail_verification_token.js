const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mail_token_schema = new Schema({
    token: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
        expires: 86400
    }
});

const MailVerificationToken = mongoose.model('mail_verification_token', mail_token_schema);

module.exports = MailVerificationToken;

