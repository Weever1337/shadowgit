import crypto from 'crypto';
import dotenv from 'dotenv';
import {Octokit} from '@octokit/rest';

dotenv.config();

export const verifyWebhookSignature = (payload, signature) => {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export const setupWebhook = async (token, repo) => {
    const octokit = new Octokit({auth: token});
    const [owner, repoName] = repo.split('/');
    try {
        const {data: hooks} = await octokit.repos.listWebhooks({
            owner,
            repo: repoName,
        });
        const existingHook = hooks.find(hook => hook.config.url === `https://${process.env.SECRET_URL}/webhook`);
        if (existingHook) {
            return {result: true};
        }
        await octokit.repos.createWebhook({
            owner,
            repo: repoName,
            name: 'web',
            config: {
                url: `https://${process.env.SECRET_URL}/webhook`,
                content_type: 'json',
                secret: process.env.WEBHOOK_SECRET,
            },
            events: ["push", "pull_request", "issues", "fork", "star", "release"],
            active: true,
        });
        return {result: true};
    } catch (error) {
        return {result: false, message: error};
    }
};