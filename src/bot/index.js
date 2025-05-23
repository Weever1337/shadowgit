import {Telegraf} from 'telegraf';
import dotenv from 'dotenv';
import {
    addCommand,
    connectCommand,
    handleCallback,
    helpCommand,
    languageCommand,
    listCommand,
    removeCommand,
    startCommand
} from './commands.js';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(startCommand);
bot.command('add', addCommand);
bot.command('remove', removeCommand);
bot.command('list', listCommand);
bot.command('connect', connectCommand);
bot.command('language', languageCommand);
bot.command('help', helpCommand);

bot.on('callback_query', handleCallback);

export const launchBot = () => {
    bot.launch();
    console.log('Telegram bot launched');
};

export default bot;