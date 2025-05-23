import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    telegramId: {type: String, required: true, unique: true},
    githubToken: {type: String},
    language: {type: String, default: 'en'},
    settings: {type: Object, default: {}},
});

const User = mongoose.model('User', userSchema);

export default User;