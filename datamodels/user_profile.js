const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const user_profile_schema = new Schema({
    name: {
        first: String,
        last: String
    },
    mobile: Number,
    dob: Date,
    gender: String,
    profilePicture: String,
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
});

const User_profile = mongoose.model('user_profile', user_profile_schema);

module.exports = User_profile;
