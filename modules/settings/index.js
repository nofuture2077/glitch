const fs = require('fs');
const PubSub = require('pubsub-js');
const storage = require('node-persist');
require('dotenv').config();

const SETTINGS_CONFIG = [
    {label: "Show Activity",name: "show_activity",type: "boolean"},
    {label: "Show Heartrate",name: "show_heartrate",type: "boolean"},
    {label: "Show Level",name: "show_level",type: "boolean"},
    {label: "Show Chat",name: "show_chat",type: "boolean"},
    {label: "Show Quests",name: "show_quests",type: "boolean"},
    {label: "Free TTS",name: "notification_tts",type: "boolean"},
    {label: "Cheer Alert",name: "notification_cheer",type: "boolean"},
    {label: "Follow Alert",name: "notification_follow",type: "boolean"},
    {label: "Raid Alert",name: "notification_raid",type: "boolean"}
]

let SETTINGS = {};

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$settings").then(indexState => {
        if (indexState) {
            SETTINGS = indexState;
        }
    });
});


module.exports = function(options) {
    var html = fs.readFileSync('./modules/settings/settings.html', 'utf8');
    var admin = fs.readFileSync('./modules/settings/admin.html', 'utf8');

    options.app.get('/modules/settings/list', (req, res) => {
        res.json(SETTINGS);
    });

    options.app.get('/modules/settings/config', (req, res) => {
        if (process.env.SECRET !== req.query.secret) {
            return res.status(401).send('No access');
        }
        res.json(SETTINGS_CONFIG);
    });

    options.app.post('/modules/settings/config', (req, res) => {
        if (process.env.SECRET !== req.query.secret) {
            return res.status(401).send('No access');
        }
        setSetting(req.body.name, req.body.value);
        res.json({});
    });

    const handleSettingMessage = (msg, data) => {
        if (data.parts.length < 3) return;

        if (!(data.mod || data.broadcaster)) return;

        const key = data.parts[1];
        const value = data.parts[2];

        SETTINGS[key] = value;
        storage.setItem("state$settings", SETTINGS);

        PubSub.publish('WS', {target: "settings", data: {
            key, 
            value
        }, op: "NEW"});
    }

    const getSetting = (key) => SETTINGS[key];
    const setSetting = (key, value) => {
        SETTINGS[key] = value;
        storage.setItem("state$settings", SETTINGS);

        PubSub.publish('WS', {target: "settings", data: {
            key, 
            value
        }, op: "NEW"});
    }

    PubSub.subscribe('MSG!setting', handleSettingMessage);
    PubSub.subscribe('MSG!settings', handleSettingMessage);

    return {
        html,
        admin,
        getSetting,
        setSetting
    }
}