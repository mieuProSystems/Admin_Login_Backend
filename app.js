const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

mongoose.connect('mongodb://localhost/loginapp1',{useNewUrlParser: true,useUnifiedTopology: true});
const db = mongoose.connection;


var routes = require('./routes/index');

//Init App
var app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
//app.use(session({secret : "something", resave : false, saveUninitialized : true}));

app.use('/', routes);

  //Set Port
  app.set('port',(process.env.PORT || 3000));


app.listen(app.get('port'),function(){
    console.log('Server running on port '+app.get('port'));
});
module.exports = app;