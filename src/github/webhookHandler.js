import {verifyWebhookSignature} from './githubApi.js';
import {sendNotification} from '../services/notify.js';

export const webhookHandler = async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (!verifyWebhookSignature(payload, signature)) {
        return res.status(401).send('Invalid signature');
    }

    await sendNotification(event, payload);
    res.status(200).send('Webhook received');
};