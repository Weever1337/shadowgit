import Subscription from '../models/subscription.js';
import bot from '../bot/index.js';
import {formatMessage} from '../utils/helpers.js';
import {loadTranslations, t} from "../utils/i18n.js";

export const sendNotification = async (event, payload) => {
    const repo = payload.repository.full_name.toLowerCase();
    const subscriptions = await Subscription.find({
        repository: {$regex: `^${repo}$`, $options: 'i'},
        isActive: true
    });

    for (const sub of subscriptions) {
        const message = await formatMessage(event, payload, sub.language);
        if (!message) continue;

        const translations = await loadTranslations(sub.language);
        try {
            await bot.telegram.sendMessage(sub.chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                message_thread_id: sub.messageThreadId || null,
                reply_markup: {
                    inline_keyboard: [[
                        {text: `🗑️ ${t(translations.delete)}`, callback_data: 'confirm_delete_msg'}
                    ]]
                }
            });
        } catch (error) {
            console.error(`Can't send message to chat ${sub.chatId}:`, error);
        }
    }
};