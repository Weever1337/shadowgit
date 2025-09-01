import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    chatId: {type: String, required: true},
    repository: {type: String, required: true},
    messageThreadId: {type: String, required: false},
    isActive: {type: Boolean, default: true},
    language: {type: String, default: 'en'}
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;