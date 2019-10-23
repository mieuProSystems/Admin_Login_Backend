var mongoose = require('mongoose');

try {
    var channelSchema = new mongoose.Schema({
        channelName: {
            type: String
        },
        channelId: {
            type: String,
            required: true
        },
        videoIds: {
            type: Array,
            "default": []
        },
        videoTitles: {
            type: Array,
            "default": []
        },
        videoThumbnails: {
            type: Array,
            "default": []
        },
        currentTime: {
            type: String
        },
        currentDate: {
            type: String
        }
    });

    var Channel = mongoose.model('channel', channelSchema);

    module.exports = Channel;
} catch (err) {
    console.log("Error in creating Channel Schema \n" + err);
}