import Subscription from '../src/models/subscription.js';

export const up = async () => {
    console.log('Applying fix-same-repos migration...');
    const subscriptions = await Subscription.find();

    const grouped = {};
    for (const sub of subscriptions) {
        const key = `${sub.chatId}:${sub.repository.toLowerCase()}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(sub);
    }

    let deletedCount = 0;
    for (const key in grouped) {
        const subs = grouped[key];
        if (subs.length > 1) {
            const [keep, ...duplicates] = subs;
            const duplicateIds = duplicates.map(dup => dup._id);
            await Subscription.deleteMany({ _id: { $in: duplicateIds } });
            deletedCount += duplicates.length;
        }
    }

    console.log(`Removed ${deletedCount} duplicate subscriptions.`);
};

export const down = async () => {
    console.log('You can not revert migration "Fix Same Repos"');
};