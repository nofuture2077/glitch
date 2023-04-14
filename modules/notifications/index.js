require('dotenv').config();
const PubSub = require('pubsub-js');
var fs = require('fs');

const state = {
    id: 0,
    queue: []
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

module.exports = function(options) {
    PubSub.subscribe('notifications', (message, data) => {
        data.id = ++state.id;
        console.log(data);
        state.queue.push(data);
        PubSub.publish('WS', {target: "notifications", data, op: "NEW"});
    });

    PubSub.subscribe('MSG!tts', (message, data) => {
        const text = data.parts.slice(1).join(" ");
        if (!text.trim()) return;
        PubSub.publish('notifications', {
            type: 'tts',
            user: data.displayname,
            text: data.parts.slice(1).join(" "),
            ttsText: data.parts.slice(1).join(" ")
        });
    });

    options.app.get('/queue', (req, res) => {
        res.json(state.queue);
    });

    options.app.get('/trigger/:id', (req, res) => {
        const data = state.queue.find(x => x.id == req.params.id);
        PubSub.publish('WS', {target: "notifications", data, op: "RETRIGGER"});
        res.end();
    });

    
    var html = fs.readFileSync('./modules/notifications/notifications.html', 'utf8').replace('GOOGLE_API_KEY', GOOGLE_API_KEY);

    return {
        html
    }
}