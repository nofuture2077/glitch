const PubSub = require('pubsub-js');
var fs = require('fs');

const queue = [];

module.exports = function(options) {

    PubSub.subscribe('notifications', (message, data) => {
        console.log(data);
        queue.push(data);
        PubSub.publish('WS', {target: "notifications", data, op: "NEW"});
    });

    PubSub.subscribe('MSG!tts', (message, data) => {
        PubSub.publish('notifications', {
            type: 'tts',
            user: data.displayName,
            text: data.parts.slice(1).join(" ")
        });
    });
    
    var html = fs.readFileSync('./modules/notifications/notifications.html', 'utf8');

    return {
        html
    }
}