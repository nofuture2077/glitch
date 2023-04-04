require('dotenv').config();
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { RefreshingAuthProvider } = require('@twurple/auth');
const fs = require('fs');
const PubSub = require('pubsub-js');

const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const botUserId = String(process.env.USERID);
const channelUserId = String(process.env.CHANNELID);
const filename = `./token/tokens.${botUserId}.json`;
const tokenDataStr = fs.readFileSync(filename, 'UTF-8')
const tokenData = JSON.parse(tokenDataStr);

const authProvider = new RefreshingAuthProvider(
	{
		clientId,
		clientSecret,
		onRefresh: async (userId, newTokenData) => {
			try {
				fs.writeFileSync(filename, JSON.stringify(newTokenData, null, 4), 'UTF-8')
			} catch(ex) {
				console.error(filename, ex);
			}
			
		}
	}
);

authProvider.addUserForToken(tokenData).then(() => {
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

