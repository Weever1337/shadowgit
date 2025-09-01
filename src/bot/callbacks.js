import Subscription from '../models/subscription.js';
import ChatSettings from '../models/chatSettings.js';
import {isAdmin} from '../utils/permissions.js';
import {loadTranslations, t} from '../utils/i18n.js';

const PAGE_SIZE = 5;

const getChatSettings = async (chatId) => {
    return await ChatSettings.findOne({chatId}) || new ChatSettings({chatId});
};

const safeEditMessage = async (ctx, text, extra = {}) => {
    try {
        await ctx.editMessageText(text, extra);
    } catch (e) {
        if (e.description && e.description.includes('message is not modified')) {
            // ignore this fucking error
        } else {
            console.error('Error while editing message:', e);
        }
    }
};

const showMainSettings = async (ctx, translations, settings) => {
    const text = t(translations.settings_main_title);
    const adminOnlyStatus = settings.adminOnly ? t(translations.status_on) : t(translations.status_off);

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{text: t(translations.settings_manage_subs_btn), callback_data: 'manage_subs:1'}],
                [{text: t(translations.settings_change_lang_btn), callback_data: 'change_lang'}],
                [{text: `${t(translations.settings_admin_mode_btn)}: ${adminOnlyStatus}`, callback_data: 'toggle_admin_only'}]
            ]
        }
    };
    await safeEditMessage(ctx, text, keyboard);
};

const generateSubsKeyboard = (subscriptions, translations, page = 1) => {
    const totalPages = Math.ceil(subscriptions.length / PAGE_SIZE);
    const pageSubs = subscriptions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const keyboard = pageSubs.map(sub => ([{
        text: `${sub.isActive ? '✅' : '❌'} ${sub.repository}`,
        callback_data: `view_sub:${sub._id}`
    }]));

    const navRow = [];
    if (page > 1) navRow.push({text: '⬅️', callback_data: `manage_subs:${page - 1}`});
    if (totalPages > 1) navRow.push({text: `📄 ${page}/${totalPages}`, callback_data: 'noop'});
    if (page < totalPages) navRow.push({text: '➡️', callback_data: `manage_subs:${page + 1}`});

    if (navRow.length > 0) keyboard.push(navRow);
    keyboard.push([{text: t(translations.back_to_settings_btn), callback_data: 'back_to_settings'}]);
    return keyboard;
};

export const settingsCommand = async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const settings = await getChatSettings(chatId);
    const translations = await loadTranslations(settings.language);

    if (!(await isAdmin(ctx))) {
        return ctx.reply(translations.adminOnly);
    }
    const text = t(translations.settings_main_title);
    const adminOnlyStatus = settings.adminOnly ? t(translations.status_on) : t(translations.status_off);
    const keyboard = {
        inline_keyboard: [
            [{text: t(translations.settings_manage_subs_btn), callback_data: 'manage_subs:1'}],
            [{text: t(translations.settings_change_lang_btn), callback_data: 'change_lang'}],
            [{text: `${t(translations.settings_admin_mode_btn)}: ${adminOnlyStatus}`, callback_data: 'toggle_admin_only'}]
        ]
    };
    await ctx.reply(text, {reply_markup: keyboard});
};

export const handleCallbackQuery = async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    const settings = await getChatSettings(chatId);
    const translations = await loadTranslations(settings.language);

    if (ctx.chat && !(await isAdmin(ctx))) {
        return ctx.answerCbQuery(translations.adminOnly, {show_alert: true});
    }

    const [action, ...params] = ctx.callbackQuery.data.split(':');

    try {
        switch (action) {
            case 'toggle_admin_only': {
                settings.adminOnly = !settings.adminOnly;
                await settings.save();
                await showMainSettings(ctx, translations, settings);
                break;
            }
            case 'manage_subs': {
                const page = parseInt(params[0] || '1', 10);
                const subscriptions = await Subscription.find({chatId});
                if (subscriptions.length === 0) {
                    await ctx.answerCbQuery(translations.noSubscriptions, {show_alert: true});
                    break;
                }
                const keyboard = generateSubsKeyboard(subscriptions, translations, page);
                await safeEditMessage(ctx, t(translations.settingsSelectRepo), {
                    reply_markup: {inline_keyboard: keyboard}
                });
                break;
            }
            case 'change_lang': {
                await safeEditMessage(ctx, t(translations.language_select_title), {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '🇬🇧 English', callback_data: 'set_lang:en'}],
                            [{text: '🇺🇳 *Русский', callback_data: 'set_lang:ru'}],
                            [{text: '🇺🇦 Український', callback_data: 'set_lang:ua'}],
                            [{text: t(translations.back_to_settings_btn), callback_data: 'back_to_settings'}]
                        ]
                    }
                });
                break;
            }
            case 'set_lang': {
                const newLang = params[0];
                settings.language = newLang;
                await settings.save();
                await Subscription.updateMany({chatId}, {language: newLang});
                const newTranslations = await loadTranslations(newLang);
                await ctx.answerCbQuery(newTranslations.language_changed_chat);
                await showMainSettings(ctx, newTranslations, settings);
                break;
            }
            case 'back_to_settings': {
                await showMainSettings(ctx, translations, settings);
                break;
            }
            case 'view_sub': {
                const subId = params[0];
                const sub = await Subscription.findById(subId);
                if (!sub) return await ctx.answerCbQuery(translations.subNotFound, {show_alert: true});

                const status = sub.isActive ? t(translations.repoStatusActive) : t(translations.repoStatusDisabled);
                const threadInfo = sub.messageThreadId ? t(translations.repoTopicInfo) : '';
                const text = `${t(translations.repoManageTitle, {repo: sub.repository})}\n${t(translations.repoStatus, {status})}${threadInfo}`;

                await safeEditMessage(ctx, text, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: sub.isActive ? t(translations.toggleNotificationsOff) : t(translations.toggleNotificationsOn),
                                callback_data: `toggle_sub:${subId}`
                            }],
                            [{text: t(translations.changeTopic), callback_data: `change_thread:${subId}`}],
                            [{text: t(translations.deleteSubscription), callback_data: `delete_sub:${subId}`}],
                            [{text: t(translations.back_to_settings_btn), callback_data: 'manage_subs:1'}],
                        ]
                    }
                });
                break;
            }
            case 'toggle_sub': {
                const subId = params[0];
                const sub = await Subscription.findById(subId);
                if (!sub) return await ctx.answerCbQuery(translations.subNotFound, {show_alert: true});
                sub.isActive = !sub.isActive;
                await sub.save();
                ctx.callbackQuery.data = `view_sub:${subId}`;
                await handleCallbackQuery(ctx);
                break;
            }
            case 'delete_sub': {
                const subId = params[0];
                await safeEditMessage(ctx, t(translations.deleteSubConfirmPrompt), {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: t(translations.deleteConfirmYes), callback_data: `delete_sub_confirm:${subId}`}],
                            [{text: t(translations.deleteConfirmCancel), callback_data: `view_sub:${subId}`}],
                        ]
                    }
                });
                break;
            }
            case 'delete_sub_confirm': {
                const subId = params[0];
                await Subscription.findByIdAndDelete(subId);
                await ctx.answerCbQuery(translations.deleteSuccess);
                const subscriptions = await Subscription.find({chatId});
                if (subscriptions.length > 0) {
                    ctx.callbackQuery.data = 'manage_subs:1';
                    await handleCallbackQuery(ctx);
                } else {
                    await showMainSettings(ctx, translations, settings);
                }
                break;
            }
            case 'change_thread': {
                const subId = params[0];
                const sub = await Subscription.findById(subId);
                if (!sub) return await ctx.answerCbQuery(translations.subNotFound, {show_alert: true});
                await safeEditMessage(ctx, t(translations.setThreadInstruction, {repo: sub.repository}), {
                    parse_mode: 'HTML',
                    reply_markup: {inline_keyboard: [[{text: t(translations.back_to_settings_btn), callback_data: `view_sub:${subId}`}]]}
                });
                break;
            }
            case 'confirm_delete_msg': {
                await ctx.editMessageReplyMarkup({
                    inline_keyboard: [[
                        {text: t(translations.deleteConfirmYes), callback_data: 'delete_msg_confirmed'},
                        {text: t(translations.deleteConfirmCancel), callback_data: 'delete_msg_cancelled'}
                    ]]
                });
                break;
            }
            case 'delete_msg_confirmed': {
                await ctx.deleteMessage();
                break;
            }
            case 'delete_msg_cancelled': {
                await ctx.editMessageReplyMarkup({
                    inline_keyboard: [[{text: `🗑️ ${t(translations.delete)}`, callback_data: 'confirm_delete_msg'}]]
                });
                break;
            }
        }
    } catch (e) {
        console.error('Error in callback query handler:', e);
    } finally {
        try {
            await ctx.answerCbQuery();
        } catch (e) {
            if (e.description && !e.description.includes('query is too old')) {
                console.error('Error answering callback query:', e);
            }
        }
    }
};