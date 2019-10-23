const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user_credential_schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    registrationMethod: {
        type: String,
        required: true,
        default: 'email'
    },
    token: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    password: String
});

const User_credential = mongoose.model('user_credential', user_credential_schema);

module.exports = User_credential;

