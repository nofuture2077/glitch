require('dotenv').config();
const PubSub = require('pubsub-js');
const storage = require('node-persist');
var fs = require('fs');

const state = {
    id: 0,
    queue: []
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$notifications").then(notifications => {
        if (notifications) {
            state.id = notifications.id;
            state.queue = notifications.queue;
        }
    });
});

module.exports = function(options) {

    const trigger = (index) => {
        const data = state.queue.find(x => x.id == index);
        PubSub.publish('WS', {target: "notifications", data, op: "RETRIGGER"});
    };

    PubSub.subscribe('notifications', (message, data) => {
        data.id = ++state.id;
        console.log(data);
        state.queue.push(data);
        state.queue = state.queue.splice(-50, 50);
        storage.setItem("state$notifications", state);
        PubSub.publish('WS', {target: "notifications", data, op: "NEW"});
    });

    options.app.get('/notifications/queue', (req, res) => {
        res.json([...state.queue].reverse());
    });

    options.app.get('/notifications/trigger/:id', (req, res) => {
        trigger(req.params.id);
        res.end();
    });

    
    var html = fs.readFileSync('./modules/notifications/notifications.html', 'utf8').replace('GOOGLE_API_KEY', GOOGLE_API_KEY);
    var admin = fs.readFileSync('./modules/notifications/admin.html', 'utf8');

    return {
        html,
        admin
    }
}