const PubSub = require('pubsub-js');
var fs = require('fs');

let questId = 4;

// new, abort, done, active
let quests = [
    {id: 1, name: 'Finde und mach ein Photo von Hirsch', exp: 500, status: 'ABORT'},
    {id: 2, name: 'Finde und mach ein Photo von Reh', exp: 500, status: 'DONE'},
    {id: 3, name: 'Überhole 3 Radfahrer in 60 Sekunden', exp: 300, status: 'NEW'},
    {id: 4, name: 'Fuss in Gewässer dippen', exp: 300, status: 'ACTIVE'}
];

function addQuest(parts) {
    if (parts.length < 4) return; // write message to chat?

    const newQuest = {
        id: questId++,
        exp: parseInt(parts[2]),
        name: parts.slice(3).join(" "),
        status: 'NEW'
    };

    quests.push(newQuest);
    PubSub.publish('WS', {target: "quests", data: quests, op: "NEW"});
}

function questStatus(parts, status) {
    if (parts.length < 3) return; // write message to chat?
    id = parseInt(parts[2]);
    quests.forEach(q => {
        if (q.id === id) {
            if (q.status !== 'DONE' && status === 'DONE') {
                PubSub.publish('LEVEL!EXP', q.exp);
            }
            q.status = status;
            PubSub.publish('WS', {target: "quests", data: quests, op: "UPDATE"});
        }
    });
}


function deleteQuest(parts) {
    if (parts.length < 3) return; // write message to chat?
    id = parseInt(parts[2]);
    quests = quests.filter(q => q.id !== id);
    PubSub.publish('WS', {target: "quests", data: quests, op: "DELETE"});
}

module.exports = function(options) {
    var data = fs.readFileSync('./modules/quests/quests.html', 'utf8');

    PubSub.subscribe('MSG!quests', (msg, data) => {
        if (!(data.mod || data.broadcaster)) return;
        if (data.parts.length < 2) return;
        const cmd = data.parts[1];
        if (cmd === "add") {
            addQuest(data.parts);
        }
        if (cmd === "done") {
            questStatus(data.parts, "DONE");
        }
        if (cmd === "abort") {
            questStatus(data.parts, "ABORT");
        }
        if (cmd === "active") {
            questStatus(data.parts, "ACTIVE");
        }
        if (cmd === "delete") {
            deleteQuest(data.parts);
        }
    });

    options.app.get('/modules/quests/list', (req, res) => {
        res.json(quests);
    });
    
    return {
        'html': data
    };
 }