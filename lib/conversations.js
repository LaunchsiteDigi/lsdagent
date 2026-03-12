import { getChatById, getMessagesByChatId } from './db/chats.js';
import { githubApi } from './tools/github.js';

/**
 * Format a chat and its messages as a readable markdown file.
 * @param {object} chat - Chat record from DB
 * @param {object[]} messages - Message records from DB
 * @returns {string} Markdown content
 */
function formatChatAsMarkdown(chat, messages) {
  const created = new Date(chat.createdAt).toISOString();
  const updated = new Date(chat.updatedAt).toISOString();
  const title = chat.title || 'Untitled';

  const lines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `id: ${chat.id}`,
    `created: ${created}`,
    `updated: ${updated}`,
    `message_count: ${messages.length}`,
    '---',
    '',
    `# ${title}`,
    '',
  ];

  for (const msg of messages) {
    const timestamp = new Date(msg.createdAt).toISOString();
    const label = msg.role === 'user' ? 'User' : 'Assistant';
    lines.push(`### ${label}`);
    lines.push(`*${timestamp}*`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Debounced sync queue ────────────────────────────────────────────────────

const pendingChatIds = new Set();
let flushTimer = null;
const DEBOUNCE_MS = 30_000; // 30 seconds after last message

/**
 * Queue a chat for sync to the git repository.
 * Syncs are debounced — commits happen 30s after the last queued chat.
 * @param {string} chatId
 */
export function queueSync(chatId) {
  pendingChatIds.add(chatId);

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushSync().catch(err => {
      console.error('[conversations] flush failed:', err.message);
    });
  }, DEBOUNCE_MS);
}

/**
 * Immediately flush all pending conversation syncs to git.
 * Batches multiple chats into a single commit.
 * @returns {Promise<{committed: number}>}
 */
export async function flushSync() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const chatIds = [...pendingChatIds];
  pendingChatIds.clear();
  if (chatIds.length === 0) return { committed: 0 };

  return commitConversations(chatIds);
}

/**
 * Sync a single chat to git immediately.
 * @param {string} chatId
 * @returns {Promise<{committed: number}>}
 */
export async function syncChat(chatId) {
  return commitConversations([chatId]);
}

/**
 * Sync all chats for a user to git.
 * @param {string} userId
 * @returns {Promise<{committed: number}>}
 */
export async function syncAllChats(userId) {
  const { getChatsByUser } = await import('./db/chats.js');
  const chats = getChatsByUser(userId);
  if (chats.length === 0) return { committed: 0 };
  return commitConversations(chats.map(c => c.id));
}

// ── Git commit via GitHub API ───────────────────────────────────────────────

/**
 * Commit conversation markdown files to the repo in a single commit.
 * Uses the Git Data API to batch all files into one tree/commit.
 * @param {string[]} chatIds - Chat IDs to export
 * @returns {Promise<{committed: number}>}
 */
async function commitConversations(chatIds) {
  const { GH_OWNER, GH_REPO } = process.env;
  if (!GH_OWNER || !GH_REPO) {
    console.warn('[conversations] GH_OWNER/GH_REPO not set — skipping sync');
    return { committed: 0 };
  }

  const repo = `/repos/${GH_OWNER}/${GH_REPO}`;

  // Build tree entries for each chat
  const treeEntries = [];
  const titles = [];

  for (const chatId of chatIds) {
    try {
      const chat = getChatById(chatId);
      if (!chat) continue;

      const messages = getMessagesByChatId(chatId);
      if (messages.length === 0) continue;

      const markdown = formatChatAsMarkdown(chat, messages);
      treeEntries.push({
        path: `conversations/${chatId}.md`,
        mode: '100644',
        type: 'blob',
        content: markdown,
      });
      titles.push(chat.title || chatId);
    } catch (err) {
      console.error(`[conversations] failed to format chat ${chatId}:`, err.message);
    }
  }

  if (treeEntries.length === 0) return { committed: 0 };

  // Get main branch HEAD
  const mainRef = await githubApi(`${repo}/git/ref/heads/main`);
  const mainSha = mainRef.object.sha;
  const mainCommit = await githubApi(`${repo}/git/commits/${mainSha}`);
  const baseTreeSha = mainCommit.tree.sha;

  // Create tree with conversation files
  const tree = await githubApi(`${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries,
    }),
  });

  // Create commit
  const commitMessage = treeEntries.length === 1
    ? `Sync conversation: ${titles[0]}`
    : `Sync ${treeEntries.length} conversations`;

  const commit = await githubApi(`${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [mainSha],
    }),
  });

  // Fast-forward main
  await githubApi(`${repo}/git/refs/heads/main`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  console.log(`[conversations] committed ${treeEntries.length} conversation(s): ${titles.join(', ')}`);
  return { committed: treeEntries.length };
}

export { formatChatAsMarkdown };
