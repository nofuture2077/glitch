require('dotenv').config();
const { authProvider } = require('../../commons/twitchauth');
const { ApiClient } = require('@twurple/api');
const PubSub = require('pubsub-js');

const channelId = process.env.CHANNELID;
const botUserId = process.env.USERID;

const api = new ApiClient({ authProvider });

api.asUser(botUserId, (ctx) => {
    const createClip = () => {
        ctx.clips.createClip({ channel: channelId }).then((clipId) => {
            ctx.clips.getClipById(clipId).then((clip) => {
                if (clip) {
                    PubSub.publish('PostChatMessage', 'Neuer Clip: ' + clip.url);
                }
            }, (error) => {
                console.log(error)
            });
        }, (error) => {
            console.log(error);
        });
    }
    
    PubSub.subscribe("ClipIt", (msg, data) => {
        createClip();
    });
    
    PubSub.subscribe('MSG!clip', (msg, data) => {
        createClip();
    });
});

module.exports = function (options) {
    return {};
}