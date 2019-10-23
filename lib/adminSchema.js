var mongoose = require('mongoose');

try {
    //Schema for the Admin
    var adminSchema = new mongoose.Schema({
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true
        },
        userMail: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        mobileNo: {
            type: Number
        },
        isLogged: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        createdAt: {
            type: String,
            required: true
        },
        changePasswordToken: {
            type: String
        }
    });

    //Creating a collection for Admin in the DB
    var Admin = mongoose.model('Admin', adminSchema);

    module.exports = Admin;
} catch (err) {
    console.log("Error in creating Admin Schema \n" + err);
}
