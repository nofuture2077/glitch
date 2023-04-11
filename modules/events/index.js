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

	listener.onChannelRaidTo(channelUserId, (ev) => {
		console.log(ev);
		const displayName = ev.raidingBroadcasterDisplayName();
		const viewers = ev.viewers();

		PubSub.publish('notifications', {type: 'raid', user: displayName, amount: viewers});
		PubSub.publish('LEVEL!EXP', 10 * viewers);
	});

	listener.onChannelFollow(channelUserId, botUserId, e => {
		PubSub.publish('notifications', {type: 'follow', user: e.userDisplayName});
		PubSub.publish('LEVEL!EXP', 100);
	});

	listener.onChannelSubscription(channelUserId, (ev) => {
		console.log(ev);
	});

	listener.onChannelSubscriptionGift(channelUserId, (ev) => {
		console.log(ev);
	});

	listener.onChannelSubscriptionMessage(channelUserId, (ev) => {
		console.log(ev);
	});

	listener.onChannelCheer(channelUserId, (ev) => {
		console.log(ev);
	});

	listener.start();
});


module.exports = function(options) {}

