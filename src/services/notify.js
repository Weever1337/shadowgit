import Subscription from '../models/subscription.js';
import bot from '../bot/index.js';
import {formatMessage} from '../utils/helpers.js';

export const sendNotification = async (event, payload) => {
    const repo = payload.repository.full_name.toLowerCase();
    console.log(repo);
    const subscriptions = await Subscription.find({
        repository: {$regex: `^${repo}$`, $options: 'i'}
    });
    console.log(subscriptions);

    for (const sub of subscriptions) {
        const message = formatMessage(event, payload);
        try {
            await bot.telegram.sendMessage(sub.chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } catch {
            console.log("Can't send message to: " + sub.chatId)
        }
    }
};