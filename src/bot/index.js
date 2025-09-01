import {Telegraf} from 'telegraf';
import dotenv from 'dotenv';
import {
    addCommand,
    connectCommand,
    helpCommand,
    listCommand,
    removeCommand,
    startCommand,
    setThreadCommand
} from './commands.js';
import {settingsCommand, handleCallbackQuery} from './callbacks.js';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.catch((err, ctx) => {
    console.error(`Error for update ${ctx.update.update_id}:`, err);
});

bot.start(startCommand);
bot.command('add', addCommand);
bot.command('remove', removeCommand);
bot.command('list', listCommand);
bot.command('connect', connectCommand);
bot.command('help', helpCommand);
bot.command('settings', settingsCommand);
bot.command('setthread', setThreadCommand);

bot.on('callback_query', handleCallbackQuery);

export const launchBot = () => {
    bot.launch();
    console.log('Telegram bot launched');
};

export default bot;