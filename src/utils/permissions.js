import ChatSettings from "../models/chatSettings.js";

export const isAdmin = async (ctx) => {
    const chatId = ctx.chat.id.toString();

    if (ctx.chat.type === 'private') {
        return true;
    }

    const settings = await ChatSettings.findOne({chatId});
    if (settings && settings.adminOnly === false) {
        return true;
    }

    const userId = ctx.from.id;
    try {
        const admins = await ctx.getChatAdministrators();
        return admins.some(admin => admin.user.id === userId);
    } catch (e) {
        console.error("Failed to get chat administrators:", e);
        return false;
    }
};