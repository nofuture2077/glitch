const fs = require('fs');
const PubSub = require('pubsub-js');

PubSub.subscribe("WORKOUT_DATA", (msg, data) => {
    if (data.liveData && data.liveData.heart_rate) {
        PubSub.publish('WS', { target: "heartrate", data: {pulse: data.liveData.heart_rate}, op: "UPDATE" });
    }
});

module.exports = function (options) {
    var html = fs.readFileSync('./modules/heartrate/heartrate.html', 'utf8');

    return {
        html    
    };
}