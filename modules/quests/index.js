const PubSub = require('pubsub-js');
const storage = require('node-persist');
var fs = require('fs');

let proposed = []

let state = {
    questId: 1,
    quests: []
}

defaultExp = 500;

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$quests").then(indexState => {
        if (indexState) {
            state = indexState;
        }
    });
});

function addQuestDirectly(msg, user) {
    const parts = msg.split(" ");
    if (parts.length === 0) {
        return;
    }
    const expTest = parseInt(parts[0]);

    const text = parts.slice(expTest ? 1 : 0).join(" ");

    const newQuest = {
        id: state.questId++,
        exp: expTest || defaultExp,
        name: text,
        status: 'NEW',
        user
    };
    state.quests.push(newQuest);
    storage.setItem("state$quests", state);
    PubSub.publish('WS', {target: "quests", data: state.quests, op: "NEW"});
    PubSub.publish('PostChatMessage', 'Quest angenommen: (' + newQuest.id + ') ' + newQuest.name + ' (' + newQuest.exp + ' Exp)');
    PubSub.publish('notifications', {type: 'quest#new', text: "Neue Quest: " + newQuest.name});
}


function addQuest(parts, user) {
    if (parts.length < 2) return;
    const expTest = parseInt(parts[1]);

    const text = parts.slice(expTest ? 2 : 1).join(" ");
    const newQuest = {
        id: state.questId++,
        exp: expTest || defaultExp,
        name: text,
        status: 'PROPOSED',
        user
    };

    proposed.push(newQuest);
    PubSub.publish('PostChatMessage', 'Neue Quest vorgeschlagen: (' + newQuest.id + ') ' + text + ' (' + newQuest.exp + ' Exp)');
}

function acceptQuest(parts) {
    if (parts.length < 3) return;
    const id = parseInt(parts[2]);

    const quest = proposed.find(p => p.id === id);

    let exp = 0;
    if (parts.length === 4) {
        exp = parseInt(parts[3]);
    }

    if (quest) {
        quest.status = 'NEW';
        quest.exp = exp || quest.exp; 
        proposed = proposed.filter(q => q.id !== id);
        state.quests.push(quest);

        storage.setItem("state$quests", state);
        PubSub.publish('WS', {target: "quests", data: state.quests, op: "NEW"});
        PubSub.publish('PostChatMessage', 'Quest angenommen: (' + quest.id + ') ' + quest.name + ' (' + quest.exp + ' Exp)');
        PubSub.publish('notifications', {type: 'quest#new', text: "Neue Quest: " + quest.name});
    }
}

function questStatus(parts, status) {
    if (parts.length < 3) return; // write message to chat?
    const id = parseInt(parts[2]);
    state.quests.forEach(q => {
        if (q.id === id) {
            if (q.status !== 'DONE' && status === 'DONE') {
                PubSub.publish('LEVEL!EXP', q.exp);
                PubSub.publish('notifications', {type: 'quest#success', text: "Quest erfolgreich: " + q.name});
                setTimeout(() => PubSub.publish('ClipIt'), 5000);
            } else if (status === 'ABORT') {
                PubSub.publish('notifications', {type: 'quest#failed', text: "Quest fehlgeschlagen: " + q.name});
            } else {
                PubSub.publish('notifications', {type: 'quest#update', text: "Quest aktiv: " + q.name});
            }
            q.status = status;
            PubSub.publish('WS', {target: "quests", data: state.quests, op: "UPDATE"});
        } else {
            if (status === 'ACTIVE' && q.status === 'ACTIVE') {
                q.status = 'NEW';
            }
        }
    });
    storage.setItem("state$quests", state);
}


function deleteQuest(parts) {
    if (parts.length < 3) return; // write message to chat?
    id = parseInt(parts[2]);
    state.quests = state.quests.filter(q => q.id !== id);
    PubSub.publish('WS', {target: "quests", data: state.quests, op: "UPDATE"});
    storage.setItem("state$quests", state);
}

function changeText(parts) {
    if (parts.length < 4) return; // write message to chat?
    const id = parseInt(parts[2]);
    const text = parts.slice(3).join(" ");

    state.quests.forEach(q => {
        if (q.id === id) {
            q.name = text;
            PubSub.publish('WS', {target: "quests", data: state.quests, op: "UPDATE"});
        }
    });
    storage.setItem("state$quests", state);
}

function clearQuests() {
    state.quests = state.quests.filter(q => ["DONE", "ABORT"].indexOf(q.status) === -1);
    PubSub.publish('WS', {target: "quests", data: state.quests, op: "DELETE"});
    storage.setItem("state$quests", state);
}

module.exports = function(options) {
    var data = fs.readFileSync('./modules/quests/quests.html', 'utf8');

    const handleQuestMessage = (msg, data) => {
        if (data.parts.length === 1) {
            PubSub.publish('PostChatMessage', 'Schlage über den Chat Nebenquests vor. Quests geben Erfahrungspunkte und steigern das Streamer Level. !addquest Mach einen Kickflip');
            return;
        }
        const cmd = data.parts[1].toLowerCase()

        if ((cmd === "list" || cmd === "l") && (data.mod || data.broadcaster)) {
            let quests = state.quests.map(q => q.id + " - " + q.user + " - " + q.name + " - " + q.status + " - " + q.exp + " Exp");
            return PubSub.publish('PostChatMessage', quests.join(" // "));
        }
        if ((cmd === "done" || cmd === "d") && (data.mod || data.broadcaster)) {
            return questStatus(data.parts, "DONE");
        }
        if (cmd === "abort" && (data.mod || data.broadcaster)) {
            return questStatus(data.parts, "ABORT");
        }
        if (cmd === "active" && (data.mod || data.broadcaster)) {
            return questStatus(data.parts, "ACTIVE");
        }
        if ((cmd === "accept" || cmd === "a") && (data.mod || data.broadcaster)) {
            return acceptQuest(data.parts);
        }
        if (cmd === "delete" && (data.mod || data.broadcaster)) {
            return deleteQuest(data.parts);
        }
        if (cmd === "clear" && (data.mod || data.broadcaster)) {
            return clearQuests();
        }
        if (cmd === "text" && (data.mod || data.broadcaster)) {
            return changeText(data.parts);
        }
        return addQuest(data.parts, data.displayname);
    };

    PubSub.subscribe('MSG!quests', handleQuestMessage);
    PubSub.subscribe('MSG!quest', handleQuestMessage);
    PubSub.subscribe('MSG!addquest', handleQuestMessage);
    PubSub.subscribe('MSG!q', handleQuestMessage);
    PubSub.subscribe('MSG!Neue Quest', (msg, data) => {
        addQuestDirectly(data.text, data.displayname);
    });

    options.app.get('/modules/quests/list', (req, res) => {
        res.json(state.quests);
    });
    
    return {
        'html': data
    };
 }