const PubSub = require('pubsub-js');
var fs = require('fs');

module.exports = function(options) {
    var data = fs.readFileSync('./modules/level/level.html', 'utf8');

    return {
        'html': data
    };
 }