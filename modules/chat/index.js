require('dotenv').config();
const { authProvider } = require('../../commons/twitchauth');
const { ChatClient } = require('@twurple/chat');
const PubSub = require('pubsub-js');

const channel = process.env.CHANNEL;

const chatClient = new ChatClient({ authProvider, channels: [channel] });

chatClient.onMessage(async (channel, user, text, msg) => {
    const isCommand = text.indexOf('!' === 0);
    if (isCommand) {
        const parts = text.split(" ");
        const data = {
            text: text,
            parts: parts,
            mod: msg.userInfo.isMod,
            channel: channel,
            broadcaster: msg.userInfo.isBroadcaster,
            username: msg.userInfo.userName,
            displayname: msg.userInfo.displayName,
            color: msg.userInfo.color
        };
        PubSub.publish('MSG' + parts[0], data);
    }
});

PubSub.subscribe('PostChatMessage', (msg, message) => {
    chatClient.say(channel, message);
});

chatClient.connect();

module.exports = function(options) {
    return {
    };
 }