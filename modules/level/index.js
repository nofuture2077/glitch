const PubSub = require('pubsub-js');
var fs = require('fs');
const levels = [1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 81000, 105000, 120000, 136000, 153000, 161000, 180000, 200000];
level = 0;
exp = 0;

module.exports = function(options) {
    var data = fs.readFileSync('./modules/level/level.html', 'utf8');

    PubSub.subscribe('LEVEL!EXP', (msd, data) => {
        let levelexp = levels[level];
        exp += data;
        while (exp >= levelexp) {
            exp -= levelexp;
            levelexp = levels[++level];
        }
        PubSub.publish('WS', {
            target: 'level',
            data: {
                level: level + 1,
                exp,
                levelexp
            }
        });
    });

    options.app.get('/modules/level/current', (req, res) => {
        let levelexp = levels[level];
        res.json({
            level: level + 1,
            exp,
            levelexp
        });
    });


    return {
        'html': data
    };
 }