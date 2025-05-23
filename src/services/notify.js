import Subscription from '../models/subscription.js';
import bot from '../bot/index.js';
import { formatMessage } from '../utils/helpers.js';

export const sendNotification = async (event, payload) => {
    const repo = payload.repository.full_name;
    const subscriptions = await Subscription.find({ repository: repo, events: { $in: [event, '*'] } });

    for (const sub of subscriptions) {
        const message = formatMessage(event, payload);
        await bot.telegram.sendMessage(sub.chatId, message, { parse_mode: 'HTML' });
    }
};