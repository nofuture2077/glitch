require('dotenv').config();
const { authProvider } = require('../../commons/twitchauth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const PubSub = require('pubsub-js');
var fs = require('fs');

const channel = process.env.CHANNEL;
const channelId = process.env.CHANNELID;

const chatClient = new ChatClient({ authProvider, channels: [channel] });
const apiClient = new ApiClient({ authProvider });

chatClient.onMessage(async (channel, user, text, msg) => {
    const parts = text.split(" ");
    const data = {
        text: text,
        parts: parts,
        mod: msg.userInfo.isMod,
        channel: channel,
        broadcaster: msg.userInfo.isBroadcaster,
        badges: Object.fromEntries(msg.userInfo.badges),
        username: msg.userInfo.userName,
        displayname: msg.userInfo.displayName,
        id: msg.id,
        color: msg.userInfo.color
    };

    const isCommand = text.indexOf('!') === 0;
    if (isCommand) {
        PubSub.publish('MSG' + parts[0], data);
        return;
    }
    const msgParts = msg.parseEmotes().map(msgPart => {
        switch (msgPart.type) {
            case 'text': return msgPart.text.split(" ")
            case 'emote': return msgPart.displayInfo.getUrl({animationSettings: 'default', backgroundType: 'dark', size: '1.0'})
        }
    });

    data.parsedParts = msgParts;
    PubSub.publish('WS', {target: 'chat', data: data, op: "NEW"})
});

PubSub.subscribe('PostChatMessage', (msg, message) => {
    chatClient.say(channel, message);
});

chatClient.connect();

module.exports = function(options) {
    var html = fs.readFileSync('./modules/chat/chat.html', 'utf8').replace('CHANNEL_ID', channelId);

    options.app.get('/modules/chat/badges/channel', (req, res) => {
        apiClient.chat.getChannelBadges(channelId).then(newChannelBadgeSet => {
            const data = newChannelBadgeSet.reduce((a, v) => ({ ...a, [v.id]: v.versions[0].getImageUrl('1')}), {});
            res.json(data);
        });
    });

    options.app.get('/modules/chat/badges/global', (req, res) => {
        apiClient.chat.getGlobalBadges(channelId).then(newGlobalBadgeSet => {
            const data = newGlobalBadgeSet.reduce((a, v) => ({ ...a, [v.id]: v.versions[0].getImageUrl('1')}), {});
            res.json(data);
        });
    });

    return {
        html
    };
 }