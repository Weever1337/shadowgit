export const formatMessage = (event, payload) => {
    const escapeHTML = (text) =>
        text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

    let returnMessage = '';

    switch (event) {
        case 'push': {
            const commitsInfo = payload.commits.map((commit) => {
                const addedLines = commit.additions || 0;
                const removedLines = commit.deletions || 0;

                const authorLink = commit.author.username
                    ? `<a href="https://github.com/${escapeHTML(commit.author.username)}">${escapeHTML(commit.author.name || 'Unknown')} (@${escapeHTML(commit.author.username)})</a>`
                    : escapeHTML(commit.author.name || 'Unknown');

                let commitMessage = `<b>🔨 Commit <a href="${escapeHTML(commit.url || '')}">#${escapeHTML(commit.id ? commit.id.slice(0, 7) : '')}</a></b>\n<i>👤 ${authorLink}</i>\n<i>💬 ${escapeHTML(commit.message)}</i>\n`;

                if (addedLines || removedLines) {
                    commitMessage += `<pre>📊 Diff: ➕ ${addedLines} ➖ ${removedLines}</pre>\n`;
                }

                return commitMessage;
            });

            returnMessage = `<b>📏 Push to <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}:${escapeHTML(payload.ref.split('/').pop())}</a></b>\n${payload.commits.length} commits\n<a href="${escapeHTML(payload.compare || '')}">🔗 Compare</a>\n\n<blockquote expandable>${commitsInfo.join('\n')}</blockquote>`;
            break;
        }
        case 'issues': {
            const status = payload.issue.state ? `(${escapeHTML(payload.issue.state)})` : '';
            const userLink = payload.issue.user.html_url
                ? `<a href="${escapeHTML(payload.issue.user.html_url)}">@${escapeHTML(payload.issue.user.login)}</a>`
                : `@${escapeHTML(payload.issue.user.login)}`;
            returnMessage = `<b>📌 Issue ${escapeHTML(payload.action)} ${status}: <a href="${escapeHTML(payload.issue.html_url)}">${escapeHTML(payload.repository.full_name)}</a></b>\n<i>${escapeHTML(payload.issue.title)}</i>\n<a href="${escapeHTML(payload.issue.html_url)}">#${escapeHTML(payload.issue.number.toString())}</a> by ${userLink}`;
            break;
        }
        case 'star': {
            const action = payload.action === 'created' ? 'added' : 'removed';
            returnMessage = `<b>⭐️ Star ${escapeHTML(action)}: <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}</a></b>\n✨ <i>${escapeHTML(payload.repository.stargazers_count.toString())}</i>\n👤 <a href="${escapeHTML(payload.sender.html_url)}">@${escapeHTML(payload.sender.login)}</a>`;
            break;
        }
        case 'pull_request': {
            let body = payload.pull_request.body || 'No description';
            if (body.length > 200) {
                body = body.slice(0, 200) + '...';
            }
            const commitsCount = payload.pull_request.commits ? `(${escapeHTML(payload.pull_request.commits.toString())} commits)` : '';
            const userLink = payload.pull_request.user.html_url
                ? `<a href="${escapeHTML(payload.pull_request.user.html_url)}">@${escapeHTML(payload.pull_request.user.login)}</a>`
                : `@${escapeHTML(payload.pull_request.user.login)}`;
            returnMessage = `<b>📝 PR ${escapeHTML(payload.action)} ${commitsCount}: <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}</a></b>\n<i>${escapeHTML(payload.pull_request.title)}</i>\n<pre>${escapeHTML(body)}</pre>\n👤 ${userLink}\n<a href="${escapeHTML(payload.pull_request.html_url)}">#${escapeHTML(payload.pull_request.number.toString())}</a>`;
            break;
        }
        case 'create': {
            const senderLink = payload.sender.html_url
                ? `<a href="${escapeHTML(payload.sender.html_url)}">@${escapeHTML(payload.sender.login)}</a>`
                : `@${escapeHTML(payload.sender.login)}`;
            returnMessage = `<b>🖇 New ${escapeHTML(payload.ref_type)} ${escapeHTML(payload.ref)} at <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}</a></b>\n👤 ${senderLink}`;
            break;
        }
        case 'fork': {
            const forkeeOwnerLink = payload.forkee.owner.html_url
                ? `<a href="${escapeHTML(payload.forkee.owner.html_url)}">@${escapeHTML(payload.forkee.owner.login)}</a>`
                : `@${escapeHTML(payload.forkee.owner.login)}`;
            returnMessage = `<b>🍴 Forked: <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}</a></b>\n🌐 <code>${escapeHTML(payload.repository.forks.toString())}</code>\n🔗 <a href="${escapeHTML(payload.forkee.html_url)}">${escapeHTML(payload.forkee.full_name)}</a>\n👤 ${forkeeOwnerLink}\nOriginal: <a href="${escapeHTML(payload.repository.html_url)}">${escapeHTML(payload.repository.full_name)}</a>`;
            break;
        }
        default:
            returnMessage = `<b>Unknown Event (${escapeHTML(event)}) in ${escapeHTML(payload.repository.full_name)}</b>`;
            break;
    }

    return returnMessage;
};