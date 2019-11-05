var express = require('express');
var channelRouter = express.Router();
var Channel = require('../lib/channelSchema');
var moment = require('moment-timezone');
var underscore = require('underscore');
var numberOfTimes = 0;

//Add Channel and video info
channelRouter.post('/home/add/channelVideos', function (req, res) {
try {
    var channel_name = req.body.channelName;
    var channel_id = req.body.channelId;
    var videos_id = req.body.videoIds;
    var time = moment().utcOffset("+05:30").format('HH:mm:ss');
    var date = moment().format("DD/MM/YYYY");
    var video_titles = req.body.videoTitles;
    var video_thumbnails = req.body.videoThumbnails;
    var changes_in_videos;

    Channel.findOne({
    channelId: channel_id
    }, function (err, channel) {
    if (channel) {
        changes_in_videos = underscore.difference(video_titles, channel.videoTitles);
        if (!changes_in_videos.toString()) {
        console.log("No changes in channel");
        return res.status(500).send(JSON.stringify({
            "description": "Channel is already there and no changes in videos",
            "status": "failed"
        }));
        } else {
        Channel.updateOne({
            channelId: channel_id
        }, {
            $addToSet: {
            videoIds: videos_id,
            videoThumbnails: video_thumbnails,
            videoTitles: video_titles
            },
            currentDate: date,
            currentTime: time
        }, function (err, response) {
            if (err) throw err;
            console.log(channel.channelName + " Videos Added successfully");
            return res.status(200).send(JSON.stringify({
            "description": changes_in_videos + " videos appended to " + channel.channelName + " successfully",
            "status": "success"
            }));
        });
        }
    } else {
        var newChannel = new Channel();

        newChannel.channelId = channel_id;
        newChannel.videoIds = videos_id;
        newChannel.currentDate = date;
        newChannel.currentTime = time;
        newChannel.channelName = channel_name;
        newChannel.videoTitles = video_titles;
        newChannel.videoThumbnails = video_thumbnails;
        newChannel.save();
        console.log(channel_name + " Created successfully");
        return res.status(200).send(JSON.stringify({
        "description": channel_name + " Channel Created successfully",
        "status": "success"
        }));
    }
    });
} catch (err) {
    console.log(err);
    return res.status(500).send(err);
}
});

//Remove video Info
channelRouter.post('/home/remove/videos', function (req, res) {
try {
    var channel_id = req.body.channel;
    var videos_id = req.body.videos;
    Channel.findOne({
    channelId: channel_id
    }, function (err, admin) {
    if (admin) {
        var invalid_elements = underscore.difference(videos_id, admin.videosIds);
        if (invalid_elements) {
        console.log("invalid elements found--> " + invalid_elements);
        return res.send(JSON.stringify({
            "description": "invalid elements found--> " + invalid_elements,
            "status": "failed"
        }));
        } else {
        Channel.update({
            channelId: channel_id
        }, {
            $pullAll: {
            videosId: videos_id
            }
        }, function (err, response) {
            if (err) throw err;
            console.log("Videos deleted successfully");
            if (response.nModified)
            return res.status(200).send(JSON.stringify({
                "description": "Videos deleted successfully",
                "status": "success"
            }));
        });
        }
    } else {
        return res.send(JSON.stringify({
        "description": "Channel doesn't exist",
        "status": "failed"
        }));
    }
    });
} catch (err) {
    console.log(err);
    return res.status(500).send(err);
}
});

//Remove Channel
channelRouter.post('/home/remove/channel', function (req, res) {
try {
    var channel_id = req.body.channel;
    Channel.findOne({
    channelId: channel_id
    }, function (err, channel) {
    if (channel) {
        Channel.deleteOne({
        channelId: channel_id
        }, function (err, obj) {
        if (err) throw err;
        console.log("Channel deleted successfully");
        return res.status(200).send(JSON.stringify({
            "description": "Channel Deleted Successfully",
            "status": "success"
        }));
        });
    } else
        return res.send(JSON.stringify({
        "description": "Channel doesn't exist",
        "status": "failed"
        }));
    });
} catch (err) {
    console.log(err);
    return res.status(500).send(err);
}
});

//Get the details about the channels and videos
channelRouter.get('/home/getVideos', function (req, res) {
try {
    numberOfTimes = numberOfTimes + 1;
    var usersProjection = {
    __v: false,
    _id: false,
    currentTime: false,
    //videoIds : false,
    // videoTitles : false,
    currentDate: false
    };

    Channel.find({}, usersProjection).sort('-currentDate').sort('-currentTime').exec(function (err, channel) {
    
    if (err) return next(err);
    console.log("Get Video request processed successfully " + numberOfTimes);
    return res.status(200).send(JSON.stringify(channel));
    });
} catch (err) {
    console.log(err);
    return res.status(500).send(err);
}
});

module.exports = channelRouter;