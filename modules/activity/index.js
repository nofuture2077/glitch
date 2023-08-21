const fs = require('fs');
const PubSub = require('pubsub-js');
const storage = require('node-persist');

let activity = {
    activity: {
        last: null,
        distance: 0,
        time: 0,
        speed: 0,
        stopped: false
    },
    total: {
        distance: 0,
        time: 0
    },
    goal: {
        distance: 0,
        time: 0,
        totalDistance: 0,
        totalTime: 0
    }
};

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$activity").then(activityState => {
        if (activityState) {
            activity = activityState;
        }
    });
});

let lastSpeed = 0;
PubSub.subscribe("WORKOUT_DATA", (msg, data) => {
    if (!activity.activity.last) {
        activity.activity.last = data;
        return;
    }

    if (data.workout_state === 'paused') {
        lastSpeed = 0;
    }

    activity.activity.distance = data.sessionData.total_distance || activity.activity.distance || 0;
    activity.activity.time = data.sessionData.total_moving_time || activity.activity.time || 0;
    if (data.liveData) {
        lastSpeed = data.liveData.speed;
    }
    activity.activity.speed = lastSpeed;
    activity.activity.last = data;
    storage.setItem("state$activity", activity);
    PubSub.publish('WS', { target: "activity", data: activity, op: "UPDATE" });
});

PubSub.subscribe("WORKOUT_COMPLETED", (msg, data) => {
    activity.activity.stopped = true;
    storage.setItem("state$activity", activity);
    PubSub.publish('WS', { target: "activity", data: activity, op: "UPDATE" });
});

PubSub.subscribe("WORKOUT_STARTED", (msg, data) => {
    activity.total.distance += activity.activity.distance;
    activity.total.time += activity.activity.time;

    activity.activity.distance = 0;
    activity.activity.time = 0;
    activity.activity.last = null;
    storage.setItem("state$activity", activity);
    PubSub.publish('WS', { target: "activity", data: activity, op: "UPDATE" });
});

PubSub.subscribe("MSG!activity", (msg, data) => {
    if (data.parts.length === 1) {
        PubSub.publish('PostChatMessage', 'Schlage über den Chat Nebenquests vor. Quests geben Erfahrungspunkte und steigern das Streamer Level. !addquest Mach einen Kickflip');
        return;
    }
    const cmd = data.parts[1].toLowerCase();

    if (cmd === 'goal' && (data.mod || data.broadcaster) && data.parts.length >= 4) {
        const subcmd = data.parts[2].toLowerCase();
        const value = parseInt(data.parts[3]);

        activity.goal[subcmd] = value;
        switch (subcmd) {
            case 'distance': {activity.goal.distance = value; break}
            case 'totaldistance': {activity.goal.totalDistance = value; break}
            case 'time': {activity.goal.time = value; break}
            case 'totaltime': {activity.goal.totalTime = value; break}
        }
        storage.setItem("state$activity", activity);
    }

    if (cmd === 'total' && (data.mod || data.broadcaster) && data.parts.length >= 4) {
        const subcmd = data.parts[2].toLowerCase();
        const value = parseInt(data.parts[3]);

        activity.goal[subcmd] = value;
        switch (subcmd) {
            case 'distance': {activity.total.distance = value; break}
            case 'time': {activity.total.time = value; break}
        }
        storage.setItem("state$activity", activity);
    }
});

module.exports = function (options) {
    const html = fs.readFileSync('./modules/activity/activity.html', 'utf8');

    return {
        html
    }
}