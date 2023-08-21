require('dotenv').config();
const PubSub = require('pubsub-js');
const storage = require('node-persist');
var fs = require('fs');
const { authProvider } = require('../../commons/twitchauth');
const { ApiClient } = require('@twurple/api');

const apiClient = new ApiClient({ authProvider });

const state = {
    id: 1,
    entries: []
}

const channelUserId = String(process.env.CHANNELID);

const intervalMap = {};

let online = false;

function checkOnlineStatus() {
    apiClient.streams.getStreamByUserId(channelUserId).then(stream => {
        online = !!stream;
    });
}

setInterval(checkOnlineStatus, 5 * 60 * 1000);
checkOnlineStatus();


function stopEntry(entry) {
    console.log('Chatbot Timer stopped: ' + entry.id);
    clearInterval(intervalMap[entry.id]);
    delete intervalMap[entry.id];
}

function startEntry(entry) {
    const initialDelay = entry.interval * 1000 * Math.random();
    console.log('Chatbot Timer started: ' + entry.id);
    setTimeout(() => {
        console.log('Chatbot Interval started: ' + entry.id);
        intervalMap[entry.id] = setInterval(() => {
            if (online) {
                PubSub.publish('PostChatMessage', entry.text);
            } else {
                console.log('Skip chatbot message because channel is offline: ' + entry.text);
            }
        }, entry.interval * 1000);
    }, initialDelay);
}

function createEntry(name, text, interval) {
    const entry = {
        id: ++state.id,
        name, 
        text,
        interval
    }

    state.entries.push(entry);
    startEntry(entry);
    storage.setItem("state$chatbot", state);
}

function deleteEntry(id) {
    const entry = state.entries.find(e => e.id === id);
    if (entry) {
        stopEntry(entry);
        state.entries = state.entries.filter(e => e.id !== id);
        storage.setItem("state$chatbot", state);
    }
}

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$chatbot").then(chatbotdata => {
        if (chatbotdata) {
            state.id = chatbotdata.id;
            state.entries = chatbotdata.entries;

            state.entries.forEach(startEntry);
        }
    });
});

module.exports = function(options) {

    options.app.get('/modules/chatbot/list', (req, res) => {
        if (process.env.SECRET !== req.query.secret) {
            return res.status(401).send('No access');
        }
        res.json(state.entries);
    });

    options.app.post('/modules/chatbot/create', (req, res) => {
        if (process.env.SECRET !== req.query.secret) {
            return res.status(401).send('No access');
        }
        createEntry(req.body.name, req.body.text, req.body.interval)
        res.json({});
    });

    options.app.delete('/modules/chatbot/delete/:id', (req, res) => {
        if (process.env.SECRET !== req.query.secret) {
            return res.status(401).send('No access');
        }
        deleteEntry(parseInt(req.params.id));
        res.json({});
    });

    var admin = fs.readFileSync('./modules/chatbot/admin.html', 'utf8');
    return {
        admin
    };
};