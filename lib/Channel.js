var mongoose = require('mongoose');

var channelSchema = new mongoose.Schema({
    channelId : {type : String, required : true},
    videosId : { type : Array , "default" : [] }
});

var Channel = mongoose.model('channel',channelSchema);

module.exports = Channel;