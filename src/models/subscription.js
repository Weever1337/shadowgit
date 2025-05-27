import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    chatId: {type: String, required: true},
    repository: {type: String, required: true},
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;