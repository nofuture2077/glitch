const PubSub = require('pubsub-js');

module.exports = function(options) {

    options.app.get('/test/tts', (req, res) => {
        PubSub.publish('notifications', {
            type: 'cheer',
            user: "EinSebastian",
			amount: 1,
            parseParts: [{
                type: 'text',
                text: '1 bit scam',
                ttsText: '1 bit scam'
            }]
        });
        res.end();
    });

    options.app.get('/test/sub', (req, res) => {
        PubSub.publish('notifications', {
            type: 'sub',
            user: "EinSebastian"
        });
        res.end();
    });

    options.app.get('/test/gift/:amount', (req, res) => {
        const amount = parseInt(req.params.amount);
        const subSteps = [1, 5, 10, 20, 50, 100];
        const step = subSteps.findLast(x => x <= amount);
        PubSub.publish('notifications', {
            type: 'subgift' + step,
            user: "EinSebastian",
            amount: amount
        });
        res.end();
    });

    options.app.get('/test/quest', (req, res) => {
        PubSub.publish('MSG!Neue Quest', {
            displayname: "EinSebastian",
            parseParts: [{
                type: 'text',
                text: '1 bit scam',
                ttsText: '1 bit scam'
            }]
        });
        res.end();
    });

    return {
    }
}