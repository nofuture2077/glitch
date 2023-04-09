require('dotenv').config();
const { authProvider, onReady} = require('../../commons/twitchauth');
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const PubSub = require('pubsub-js');

const botUserId = String(process.env.USERID);
const channelUserId = String(process.env.CHANNELID);


onReady.then(() => {
	const apiClient = new ApiClient({ authProvider });
	const listener = new EventSubWsListener({ apiClient });

	const onlineSubscription = listener.onChannelFollow(channelUserId, botUserId, e => {
		PubSub.publish('notifications', {type: 'follow', user: e.userDisplayName});
		PubSub.publish('LEVEL!EXP', 100);
	});
	
	listener.start();
}, () => {
	console.log(this.arguments);
});

module.exports = function(options) {}

