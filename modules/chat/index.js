require('dotenv').config();
const { Chat, ChatEvents } = require("twitch-js");
const PubSub = require('pubsub-js');

const username = process.env.USERNAME;
const token = process.env.TOKEN;
const channel = process.env.CHANNEL;

module.exports = function(options) {

    const run = async () => {
        const chat = new Chat({
          username,
          token
        });
      
        await chat.connect();
        await chat.join(channel);
      
        chat.on(ChatEvents.ALL, (message) => {
            const msg = message.message;
            const channel = message.channel ? message.channel.substr(1) : undefined;
            if (!msg) {
                return;
            }
            const isCommand = msg.indexOf('!' === 0);
            if (isCommand) {
                const parts = msg.split(" ");
                const data = {
                    text: msg,
                    parts: parts,
                    mod: message.tags.mod,
                    channel: channel,
                    broadcaster: message.tags.badges.broadcaster,
                    username: message.tags.username,
                    displayname: message.tags.displayName,
                    color: message.tags.color
                };
                PubSub.publish('MSG' + parts[0], data);
            }
        });
    };

    run();

    return {
    };
 }