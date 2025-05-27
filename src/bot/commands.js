import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import {setupWebhook} from "../github/githubApi.js";
import {loadTranslations, t} from '../utils/i18n.js';

export const startCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    let user = await User.findOne({telegramId});
    if (!user) {
        user = new User({telegramId});
        await user.save();
    }
    const translations = await loadTranslations(user.language || 'en');
    await ctx.reply(translations.welcome);
};

export const addCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();
    const user = await User.findOne({telegramId});
    if (!user) {
        const translations = await loadTranslations(user?.language || 'en');
        return ctx.reply(translations.startFirst);
    }
    const translations = await loadTranslations(user.language || 'en');
    const parts = ctx.message.text.split(' ').slice(1);
    if (parts.length < 1) {
        return ctx.reply(translations.addRepoFormat);
    }
    const repo = parts[0];
    const existingSub = await Subscription.findOne({chatId, repository: repo});
    if (existingSub) {
        return ctx.reply(translations.alreadySubscribed);
    }
    const sub = new Subscription({chatId, repository: repo, events});
    if (user.githubToken) {
        const result = await setupWebhook(user.githubToken, repo);
        if (result.result) {
            await ctx.reply(t(translations.subscribed, {repo: repo}));
            await sub.save();
        } else {
            await ctx.reply(t(translations.subscriptionFailed, {repo: repo, message: result.message}));
        }
    } else {
        await ctx.reply(t(translations.subscribedNoToken, {repo: repo}));
    }
};

export const removeCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();
    const user = await User.findOne({telegramId});
    if (!user) {
        const translations = await loadTranslations(user?.language || 'en');
        return ctx.reply(translations.startFirst);
    }
    const translations = await loadTranslations(user.language || 'en');
    const repo = ctx.message.text.split(' ')[1];
    if (!repo) {
        return ctx.reply(translations.removeRepoFormat);
    }
    const sub = await Subscription.findOneAndDelete({chatId, repository: repo});
    if (sub) {
        await ctx.reply(t(translations.unsubscribed, {repo: repo}));
    } else {
        await ctx.reply(translations.notSubscribed);
    }
};

export const listCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();
    const user = await User.findOne({telegramId});
    if (!user) {
        const translations = await loadTranslations(user?.language || 'en');
        return ctx.reply(translations.startFirst);
    }
    const translations = await loadTranslations(user.language || 'en');
    const subs = await Subscription.find({chatId});
    if (subs.length === 0) {
        return ctx.reply(translations.noSubscriptions);
    }
    const message = `<blockquote expandable>${subs.map(sub => `${sub.repository}`).join('\n')}</blockquote>`;
    await ctx.reply(t(translations.yourSubscriptions, {message: message}), { parse_mode: 'HTML' });
};

export const connectCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const token = ctx.message.text.split(' ')[1];
    const user = await User.findOne({telegramId}) || new User({telegramId});
    const translations = await loadTranslations(user?.language || 'en');
    if (!token) {
        return ctx.reply(translations.connectTokenFormat);
    }
    user.githubToken = token;
    await user.save();
    await ctx.reply(translations.tokenConnected);
};

export const languageCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({telegramId}) || new User({telegramId});
    const translations = await loadTranslations(user?.language || 'en');
    await ctx.reply(translations.chooseLanguage, {
        reply_markup: {
            inline_keyboard: [
                [{text: '🇬🇧 English', callback_data: 'lang_en'}],
                [{text: '🇺🇳 *Русский', callback_data: 'lang_ru'}],
                [{text: '🇺🇦 Український', callback_data: 'lang_ua',}],
            ],
        },
    });
};

export const helpCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({telegramId});
    const translations = await loadTranslations(user?.language || 'en');
    await ctx.reply(translations.help);
};

export const handleCallback = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({telegramId});
    if (!user) return;

    const lang = ctx.callbackQuery.data.split('_')[1];
    user.language = lang;
    await user.save();

    const translations = await loadTranslations(lang);
    await ctx.reply(translations.languageChanged);
    await ctx.answerCbQuery();
};