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

const subSteps = [1, 5, 10, 20, 50, 100]; 

const onMessage = (channel, user, text, msg) => {
    console.log("Message", JSON.stringify({channel, user, text, msg}))
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

    const isReward = msg.isRedemption;
    if (isReward) {
        apiClient.channelPoints.getCustomRewardById(msg.rewardId).then((aw) => {
            PubSub.publish('MSG!' + aw.title, data);
        });
        return;
    }

    const msgParts = msg.parseEmotes();

    const parsedParts = msgParts.map(msgPart => {
        switch (msgPart.type) {
            case 'text': return msgPart.text.split(" ")
            case 'emote': return msgPart.displayInfo.getUrl({animationSettings: 'default', backgroundType: 'dark', size: '1.0'})
        }
    });

    if (msg.isCheer) {
        const ttsMessage = msgParts.map(msgPart => {
            switch (msgPart.type) {
                case 'text': return msgPart.text
                case 'emote': return msgPart.text
            }
        }).join(" ");
        PubSub.publish('notifications', {
            type: 'cheer',
            user: msg.userInfo.displayName,
			amount: msg.bits,
            text: text,
			ttsText: ttsMessage
        });
		PubSub.publish('LEVEL!EXP', msg.bits);
		PubSub.publish('PostChatMessage', msg.userInfo.displayName + ' gönnt ' + msg.bits + ' Bits.');
    }

    data.parsedParts = parsedParts;
    PubSub.publish('WS', {target: 'chat', data: data, op: "NEW"})
};

const giftCounts = new Map();

const onSub = (channel, user, subInfo, msg) => {
    console.log("Sub", JSON.stringify({channel, user, subInfo, msg}))
    if (subInfo.months === 1) {
        PubSub.publish('notifications', {
			type: 'sub',
			user: user
		});
		PubSub.publish('LEVEL!EXP', 500);
		PubSub.publish('PostChatMessage', user + ' ist jetzt auch dabei PogChamp');
    } else {
        PubSub.publish('notifications', {
            type: 'submessage',
            user: user,
            amount: subInfo.months,
            text: msg.message,
            ttsText: msg.message
        });
        PubSub.publish('LEVEL!EXP', 500);
        PubSub.publish('PostChatMessage', user + ' ist schon ' + subInfo.months + ' Monate dabei.');
    }
};

const onCommunitySub = (channel, user, subInfo) => {
    console.log("CommunitySub", JSON.stringify({channel, user, subInfo}))
    const userName = user || "Anonymous";
	const previousGiftCount = giftCounts.get(userName) ?? 0;
	giftCounts.set(userName, previousGiftCount + subInfo.count);
    const step = subSteps.findLast(x => x <= subInfo.count);
    PubSub.publish('notifications', {
        type: 'subgift' + step,
        user: userName,
        amount: subInfo.count
    });
    PubSub.publish('PostChatMessage', user + ' gönnt ' + subInfo.count + ' Abos PogChamp');
    PubSub.publish('LEVEL!EXP', 500 * subInfo.count);
};

const onSubGift = (channel, recipient, subInfo) => {
    console.log("SubGift", JSON.stringify({channel, recipient, subInfo}))
	const user = subInfo.gifterDisplayName || "Anonymous";
	const previousGiftCount = giftCounts.get(user) ?? 0;
	if (previousGiftCount > 0) {
		giftCounts.set(user, previousGiftCount - 1);
	} else {
        PubSub.publish('notifications', {
			type: 'subgift1',
			user: user,
			userTo: recipient,
			amount: 1
		});
        PubSub.publish('LEVEL!EXP', 500);
        PubSub.publish('PostChatMessage', user + ' gönnt ' + recipient + ' ein Abo PogChamp');
	}
};

chatClient.onMessage(onMessage);
chatClient.onSub(onSub);
chatClient.onCommunitySub(onCommunitySub);
chatClient.onSubGift(onSubGift);


PubSub.subscribe('PostChatMessage', (msg, message) => {
    chatClient.say(channel, message);
});

chatClient.connect();

chatClient.onDisconnect(() => {
    setTimeout(() => {
        if (!chatClient.isConnected && !chatClient.isConnecting) {
            chatClient.connect();
        }
    }, 5000);
});

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
        html,
        api: {
            onMessage,
            onSub,
            onCommunitySub,
            onSubGift
        }
    };
 }