require('dotenv').config();
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { RefreshingAuthProvider } = require('@twurple/auth');
const fs = require('fs');

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

module.exports = {
    authProvider,
    onReady: authProvider.addUserForToken(tokenData)
}