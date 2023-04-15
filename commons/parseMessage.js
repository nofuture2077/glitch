const { parseChatMessage } = require('@twurple/common');

const parse = (text, msg, cheerEmotes) => {
    const parts = parseChatMessage(text, msg.emoteOffsets, cheerEmotes.getPossibleNames());
    return parts.map(msgPart => {
        switch (msgPart.type) {
            case 'text': return {
                type: 'text',
                text: msgPart.text,
                ttsText: msgPart.text,
                parts: msgPart.text.split(' ')
            }
            case 'emote': return {
                type: 'emote',
                text: msgPart.text,
                ttsText: msgPart.text,
                url: msgPart.displayInfo.getUrl({animationSettings: 'default', backgroundType: 'dark', size: '1.0'})
            }
            case 'cheer': {
                return {
                    type: 'cheer',
                    text: msgPart.text,
                    ttsText: '',
                    url: cheerEmotes.getCheermoteDisplayInfo(msgPart.name, msgPart.amount, {background: 'dark', state: 'animated', scale: '3'}).url
                }
            }
        }
    });
}

module.exports = {
    parse
}