const PubSub = require('pubsub-js');
var fs = require('fs');

module.exports = function(options) {
    var data = fs.readFileSync('./modules/quests/quests.html', 'utf8');

    PubSub.subscribe('MSG!quests', (msg, data) => {
        if (data.parts.length < 2) return;
        const cmd = data.parts[1];
        console.log(data);
    });

    options.app.get('/modules/quests/list', (req, res) => {
        res.json({data: [{}, {}, {}]});
    });
    
    return {
        'html': data
    };
 }