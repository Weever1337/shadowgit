import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import ChatSettings from '../models/chatSettings.js';
import {setupWebhook} from "../github/githubApi.js";
import {loadTranslations, t} from '../utils/i18n.js';
import {isAdmin} from "../utils/permissions.js";

const getChatLanguage = async (chatId) => {
    const settings = await ChatSettings.findOne({chatId});
    return settings?.language || 'en';
};

export const startCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const lang = await getChatLanguage(ctx.chat.id.toString());
    const translations = await loadTranslations(lang);

    let user = await User.findOne({telegramId});
    if (!user) {
        user = new User({telegramId, language: lang});
        await user.save();
    }
    await ctx.reply(translations.welcome);
};

export const addCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();
    const user = await User.findOne({telegramId});
    const chatLang = await getChatLanguage(chatId);
    const translations = await loadTranslations(chatLang);

    if (!user) {
        return ctx.reply(translations.startFirst);
    }

    const parts = ctx.message.text.split(' ').slice(1);
    if (parts.length < 1) {
        return ctx.reply(translations.addRepoFormat);
    }
    const repo = parts[0];
    const messageThreadId = ctx.message.is_topic_message ? ctx.message.message_thread_id.toString() : null;

    const existingSub = await Subscription.findOne({chatId, repository: repo, messageThreadId});
    if (existingSub) {
        return ctx.reply(translations.alreadySubscribed);
    }

    const sub = new Subscription({chatId, repository: repo, messageThreadId, language: chatLang});
    if (user.githubToken) {
        const result = await setupWebhook(user.githubToken, repo);
        if (result.result) {
            await sub.save();
            await ctx.reply(t(translations.subscribed, {repo: repo}));
        } else {
            await ctx.reply(t(translations.subscriptionFailed, {repo: repo, message: result.message}));
        }
    } else {
        await sub.save();
        await ctx.reply(t(translations.subscribedNoToken, {repo: repo}));
    }
};

export const removeCommand = async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const lang = await getChatLanguage(chatId);
    const translations = await loadTranslations(lang);

    if (!(await isAdmin(ctx))) {
        return ctx.reply(translations.adminOnly);
    }

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
    const chatId = ctx.chat.id.toString();
    const lang = await getChatLanguage(chatId);
    const translations = await loadTranslations(lang);

    const subs = await Subscription.find({chatId});
    if (subs.length === 0) {
        return ctx.reply(translations.noSubscriptions);
    }
    const message = `<blockquote expandable>${subs.map(sub => `${sub.repository}`).join('\n')}</blockquote>`;
    await ctx.reply(t(translations.yourSubscriptions, {message: message}), {parse_mode: 'HTML'});
};

export const connectCommand = async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const lang = await getChatLanguage(ctx.chat.id.toString());
    const translations = await loadTranslations(lang);
    const token = ctx.message.text.split(' ')[1];

    if (!token) {
        return ctx.reply(translations.connectTokenFormat);
    }
    await User.findOneAndUpdate({telegramId}, {githubToken: token}, {upsert: true});
    await ctx.reply(translations.tokenConnected);
};

export const helpCommand = async (ctx) => {
    const lang = await getChatLanguage(ctx.chat.id.toString());
    const translations = await loadTranslations(lang);
    await ctx.reply(translations.help);
};

export const setThreadCommand = async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const lang = await getChatLanguage(chatId);
    const translations = await loadTranslations(lang);

    if (!(await isAdmin(ctx))) {
        return ctx.reply(translations.adminOnly);
    }

    const parts = ctx.message.text.split(' ').slice(1);
    if (parts.length < 1) {
        return ctx.reply(translations.setThreadFormat);
    }

    const repo = parts[0];
    const target = parts[1];
    const sub = await Subscription.findOne({chatId, repository: {$regex: `^${repo}$`, $options: 'i'}});

    if (!sub) {
        return ctx.reply(t(translations.setThreadRepoNotFound, {repo}));
    }

    if (target === 'general') {
        sub.messageThreadId = null;
        await sub.save();
        return ctx.reply(t(translations.setThreadSuccessGeneral, {repo: sub.repository}));
    }

    if (!ctx.message.is_topic_message) {
        return ctx.reply(translations.setThreadInsideTopic);
    }

    sub.messageThreadId = ctx.message.message_thread_id.toString();
    await sub.save();
    await ctx.reply(t(translations.setThreadSuccess, {repo: sub.repository}));
};