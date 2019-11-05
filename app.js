//Dependencies 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userAuthenticationRoutes = require('./routes/user_authentication');
const userVerificationRoutes = require('./routes/user_verification');

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const pipeline = [
    {
      $project: { documentKey: false }
    }
];

dotenv.config();

//Establishing the connection to the database
mongoose.connect('mongodb+srv://user1:pwd123@cluster0-vhws5.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

MongoClient.connect("mongodb+srv://user1:pwd123@cluster0-vhws5.mongodb.net/test?retryWrites=true&w=majority",{
useNewUrlParser: true,
useUnifiedTopology: true
}).then(client => {
  // specify db and collections
  const db = client.db("test");
  const collection = db.collection("user_credentials");

  const changeStream = collection.watch(pipeline);
  // start listen to changes
  changeStream.on("change", function(change) {
    console.log(change);
  });
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
var admin     = require('./routes/adminIndex');
var user      = require('./routes/userIndex');
var feedback  = require('./routes/feedbackIndex');
var channel   = require('./routes/channelIndex');

app.use('/', admin);
app.use('/', user);
app.use('/', feedback);
app.use('/', channel);


//Set Port
app.set('port', (process.env.PORT || 3000));

//Start the Server
app.listen(app.get('port'), function () {
    console.log('Server running on port ' + app.get('port'));
});

module.exports = app;