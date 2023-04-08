const fs = require('fs');
const PubSub = require('pubsub-js');
const storage = require('node-persist');

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

    options.app.get('/modules/settings/list', (req, res) => {
        res.json(SETTINGS);
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
    }

    PubSub.subscribe('MSG!setting', handleSettingMessage);
    PubSub.subscribe('MSG!settings', handleSettingMessage);

    return {
        html,
        getSetting,
        setSetting
    }
}