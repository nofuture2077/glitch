require('dotenv').config();
const { authProvider } = require('../../commons/twitchauth');
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const PubSub = require('pubsub-js');

const botUserId = String(process.env.USERID);
const channelUserId = String(process.env.CHANNELID);

const apiClient = new ApiClient({ authProvider });

apiClient.asUser(botUserId, (ctx) => {

	const listener = new EventSubWsListener({ apiClient: ctx });

	listener.onStreamOnline(channelUserId, (ev) => {
		console.log(ev);
		PubSub.publish('PostChatMessage', ev.broadcasterDisplayName + ' ist jetzt live.');
	});

	listener.onChannelRaidTo(channelUserId, (ev) => {
		const displayName = ev.raidingBroadcasterDisplayName;
		const viewers = ev.viewers;

		PubSub.publish('notifications', {type: 'raid', user: displayName, amount: viewers});
		PubSub.publish('LEVEL!EXP', 10 * viewers);
		PubSub.publish('PostChatMessage', '/announce ' + displayName + ' raidet mit ' + viewers + ' Viewern');
		setTimeout(() => {
			PubSub.publish('PostChatMessage', '/shoutout ' + ev.raidingBroadcasterName);
		}, 10000);
	});

	listener.onChannelFollow(channelUserId, botUserId, e => {
		PubSub.publish('notifications', {type: 'follow', user: e.userDisplayName});
		PubSub.publish('LEVEL!EXP', 100);
		PubSub.publish('PostChatMessage', e.userDisplayName + ' folgt jetzt');
	});

	listener.start();
});


module.exports = function(options) {}

