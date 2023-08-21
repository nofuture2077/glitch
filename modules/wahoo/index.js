require('dotenv').config();
const JSONP = require('node-jsonp');
const { WebSocket } = require('ws');
const PubSub = require('pubsub-js');
const FitParser = require('fit-file-parser').default;
const pako = require('pako');
const atob = require('atob');

const url = 'https://mb.wahooligan.com/faye';
let id = 1;

const channel = process.env.WAHOO_CHANNEL;

const wsClient = new WebSocket('wss://mb.wahooligan.com/faye')

var fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
});

wsClient.on('message', t => {
    const data = JSON.parse(t);
    const channelName = data[0].channel;
   
    if (channelName === `/livetrack/${channel}`) {
        const workout_data = data[0].data;
        const state = workout_data.workout_state;
        if (state === 'completed') {
            return PubSub.publish('WORKOUT_COMPLETED');
        }

        const fitMessage = extractFitMessage(data[0].data.fit[0]);
        fitParser.parse(fitMessage, function (e, fitData) {
            workout_data.liveData = fitData.records.slice(-1)[0];
            workout_data.sessionData = fitData.sessions[0];

            PubSub.publish('WORKOUT_DATA', workout_data);
        });
        
    } else if (channelName === `/livetrack/${channel}/commands`) {
        switch (data[0].data.command) {
            case 'start_new_workout': { return PubSub.publish('WORKOUT_STARTED'); }
        }
    }
});

function extractFitMessage(n) {
    let r = "";
    try {
        r = atob(n);
    } catch (e) {
        console.log("Can't extract FIT message");
        return;
    }
    r = r.split("").map(function(t) {
        return t.charCodeAt(0)
    });

    var o, s = new Uint8Array(r);

    try {
        return pako.inflate(s)
    } catch (u) {
        try {
            return pako.inflate(s.subarray(4))
        } catch (u) {
            console.log("Can't extract FIT message");
            return; 
        }
    }
}

function connectToWahoo() {
    JSONP(url, {
        message: JSON.stringify([{"channel":"/meta/handshake","version":"1.0","supportedConnectionTypes":["websocket"],"id":"1"}])
    }, 'jsonp', (json) => {
        setInterval(() => {
            wsClient.send(JSON.stringify([{"channel":"/meta/connect","clientId": json[0].clientId,"connectionType":"in-process","id":id++}]));
        }, 25000);
        wsClient.send(JSON.stringify([{"channel":"/meta/connect","clientId": json[0].clientId,"connectionType":"websocket","id":id++}]));
        wsClient.send(JSON.stringify([{"channel":"/meta/subscribe","clientId": json[0].clientId,"subscription":`/livetrack/${channel}/commands`,"id":id++}]));
        wsClient.send(JSON.stringify([{"channel":"/meta/subscribe","clientId": json[0].clientId,"subscription":`/livetrack/${channel}`,"id":id++}]));
    })
}

wsClient.on("open", (event) => {
    connectToWahoo();
});

module.exports = function(opts) {
    return {};
}