//Dependencies 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userAuthenticationRoutes = require('./routes/user_authentication');
const userVerificationRoutes = require('./routes/user_verification');

dotenv.config();

//Establishing the connection to the database
mongoose.connect('mongodb://localhost/LoginApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

//Init App
var app = express();

//Adding cors Policy
app.use(cors());

mongoose.Promise = global.Promise;

//To parse the JSON content and URL
app.use(bodyParser.json());
app.use(userAuthenticationRoutes);
app.use(userVerificationRoutes);
app.use(bodyParser.urlencoded({
    extended: false
}));

//Init Route
var routes = require('./routes/adminIndex');
//var user = require('./routes/userIndex');
//app.use('/', user);
app.use('/', routes);


//Set Port
app.set('port', (process.env.PORT || 3000));

//Start the Server
app.listen(app.get('port'), function () {
    console.log('Server running on port ' + app.get('port'));
});

module.exports = app;