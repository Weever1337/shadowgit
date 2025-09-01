import mongoose from 'mongoose';

const chatSettingsSchema = new mongoose.Schema({
    chatId: {type: String, required: true, unique: true},
    language: {type: String, default: 'en'},
    adminOnly: {type: Boolean, default: true}
});

const ChatSettings = mongoose.model('ChatSettings', chatSettingsSchema);

export default ChatSettings;