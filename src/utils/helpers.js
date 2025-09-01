import he from 'he';
import {loadTranslations, t} from './i18n.js';

const escapeHTML = (text) => {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const formatMessage = async (event, payload, lang = 'en') => {
    const translations = await loadTranslations(lang);
    let returnMessage = '';

    switch (event) {
        case 'push': {
            if (payload.deleted) {
                returnMessage = t(translations['event_push.branch_deleted'], {
                    branch: escapeHTML(payload.ref.split('/').pop()),
                    repoUrl: escapeHTML(payload.repository.html_url),
                    repoName: escapeHTML(payload.repository.full_name),
                    user: escapeHTML(payload.sender.login)
                });
                break;
            }

            if (!payload.commits || payload.commits.length === 0) return '';

            const commitPromises = payload.commits.map((commit) => {
                const authorLink = commit.author.username
                    ? `<a href="https://github.com/${escapeHTML(commit.author.username)}">${escapeHTML(commit.author.name || 'Unknown')} (@${escapeHTML(commit.author.username)})</a>`
                    : escapeHTML(commit.author.name || 'Unknown');

                const messageText = he.decode(commit.message || '');

                return t(translations['event_push.commitLine'], {
                    commitUrl: escapeHTML(commit.url || ''),
                    commitId: escapeHTML(commit.id ? commit.id.slice(0, 7) : ''),
                    author: authorLink,
                    message: escapeHTML(messageText)
                });
            });

            const commitsInfo = await Promise.all(commitPromises);

            const branch = escapeHTML(payload.ref.split('/').pop());
            const title = t(translations['event_push.title'], {
                repoUrl: escapeHTML(payload.repository.html_url),
                branch: branch,
                repoName: escapeHTML(payload.repository.full_name)
            });
            const commitsCount = t(translations['event_push.commits'], {count: payload.commits.length});
            const compareLink = `<a href="${escapeHTML(payload.compare || '')}">${t(translations['event_push.compare'])}</a>`;

            returnMessage = `${title}\n${commitsCount}\n${compareLink}\n\n<blockquote expandable>${commitsInfo.join('\n')}</blockquote>`;
            break;
        }
        case 'issues': {
            const action = t(translations[`event_issues.${payload.action}`] || payload.action);
            const userLink = `<a href="${escapeHTML(payload.issue.user.html_url)}">@${escapeHTML(payload.issue.user.login)}</a>`;

            returnMessage = t(translations['event_issues.title'], {
                action: action,
                state: escapeHTML(payload.issue.state),
                issueUrl: escapeHTML(payload.issue.html_url),
                repoName: escapeHTML(payload.repository.full_name),
                issueTitle: escapeHTML(payload.issue.title),
                issueNumber: escapeHTML(payload.issue.number.toString()),
                user: userLink
            });
            break;
        }
        case 'star': {
            const key = `event_star.${payload.action}`;
            returnMessage = t(translations[key], {
                repoUrl: escapeHTML(payload.repository.html_url),
                repoName: escapeHTML(payload.repository.full_name),
                count: escapeHTML(payload.repository.stargazers_count.toString()),
                userUrl: escapeHTML(payload.sender.html_url),
                userLogin: escapeHTML(payload.sender.login)
            });
            break;
        }
        case 'pull_request': {
            let body = payload.pull_request.body || t(translations['event_pull_request.no_description']);
            if (body.length > 200) {
                body = body.slice(0, 200) + '...';
            }
            const userLink = `<a href="${escapeHTML(payload.pull_request.user.html_url)}">@${escapeHTML(payload.pull_request.user.login)}</a>`;
            const action = t(translations[`event_pull_request.${payload.action}`] || payload.action);

            returnMessage = t(translations['event_pull_request.title'], {
                action: action,
                commits: escapeHTML(payload.pull_request.commits?.toString() || '0'),
                repoUrl: escapeHTML(payload.repository.html_url),
                repoName: escapeHTML(payload.repository.full_name),
                prTitle: escapeHTML(payload.pull_request.title),
                body: escapeHTML(body),
                user: userLink,
                prUrl: escapeHTML(payload.pull_request.html_url),
                prNumber: escapeHTML(payload.pull_request.number.toString())
            });
            break;
        }
        case 'create': {
            const senderLink = `<a href="${escapeHTML(payload.sender.html_url)}">@${escapeHTML(payload.sender.login)}</a>`;
            returnMessage = t(translations['event_create.title'], {
                refType: escapeHTML(payload.ref_type),
                ref: escapeHTML(payload.ref),
                repoUrl: escapeHTML(payload.repository.html_url),
                repoName: escapeHTML(payload.repository.full_name),
                user: senderLink
            });
            break;
        }
        case 'fork': {
            const forkeeOwnerLink = `<a href="${escapeHTML(payload.forkee.owner.html_url)}">@${escapeHTML(payload.forkee.owner.login)}</a>`;
            returnMessage = t(translations['event_fork.title'], {
                repoUrl: escapeHTML(payload.repository.html_url),
                repoName: escapeHTML(payload.repository.full_name),
                forks: escapeHTML(payload.repository.forks.toString()),
                forkeeUrl: escapeHTML(payload.forkee.html_url),
                forkeeName: escapeHTML(payload.forkee.full_name),
                forkeeOwner: forkeeOwnerLink
            });
            break;
        }
        default:
            return '';
    }

    return returnMessage;
};