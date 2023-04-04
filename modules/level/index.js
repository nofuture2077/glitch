const PubSub = require('pubsub-js');
const storage = require('node-persist');
var fs = require('fs');
const levels = [1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 81000, 105000, 120000, 136000, 153000, 161000, 180000, 200000];

let state = {
    level: 0,
    exp: 0
}
let store = null;

storage.init({
    dir: './storage/'
}).then(options => {
    storage.getItem("state$index").then(indexState => {
        if (indexState) {
            state = indexState;
        }
    });
});

module.exports = function(options) {
    var data = fs.readFileSync('./modules/level/level.html', 'utf8');

    PubSub.subscribe('LEVEL!EXP', (msd, data) => {
        let levelexp = levels[state.level];
        state.exp += data;
        while (state.exp >= levelexp) {
            state.exp -= levelexp;
            levelexp = levels[++state.level];
        }
        storage.setItem("state$index", state);
        PubSub.publish('WS', {
            target: 'level',
            data: {
                level: state.level + 1,
                exp: state.exp,
                levelexp
            }
        });
    });

    options.app.get('/modules/level/current', (req, res) => {
        let levelexp = levels[state.level];
        res.json({
            level: state.level + 1,
            exp: state.exp,
            levelexp
        });
    });


    return {
        'html': data
    };
 }