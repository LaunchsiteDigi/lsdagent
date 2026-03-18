import { randomUUID } from 'crypto';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from './index.js';
import { notifications, subscriptions } from './schema.js';

/**
 * Create a notification, then distribute to all subscribers.
 * @param {string} notificationText - Human-readable notification text
 * @param {object} payload - Raw webhook payload
 * @returns {Promise<object>} The created notification
 */
export async function createNotification(notificationText, payload) {
  const db = await getDb();
  const now = Date.now();
  const row = {
    id: randomUUID(),
    notification: notificationText,
    payload: JSON.stringify(payload),
    read: 0,
    createdAt: now,
  };
  await db.insert(notifications).values(row).run();

  // Distribute to subscribers (fire-and-forget)
  distributeNotification(notificationText).catch((err) => {
    console.error('Failed to distribute notification:', err);
  });

  return row;
}

/**
 * Get all notifications, newest first.
 * @returns {Promise<object[]>}
 */
export async function getNotifications() {
  const db = await getDb();
  return await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .all();
}

/**
 * Get count of unread notifications.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const db = await getDb();
  const result = await db
    .select({ count: sql`count(*)` })
    .from(notifications)
    .where(eq(notifications.read, 0))
    .get();
  return result?.count ?? 0;
}

/**
 * Mark all notifications as read.
 */
export async function markAllRead() {
  const db = await getDb();
  await db.update(notifications)
    .set({ read: 1 })
    .where(eq(notifications.read, 0))
    .run();
}

/**
 * Get all subscriptions.
 * @returns {Promise<object[]>}
 */
export async function getSubscriptions() {
  const db = await getDb();
  return await db.select().from(subscriptions).all();
}

/**
 * Distribute a notification to all subscribers.
 * @param {string} notificationText - The notification message
 */
async function distributeNotification(notificationText) {
  const subs = await getSubscriptions();
  if (!subs.length) return;

  for (const sub of subs) {
    try {
      if (sub.platform === 'telegram') {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) continue;
        const { sendMessage } = await import('../tools/telegram.js');
        await sendMessage(botToken, sub.channelId, notificationText);
      }
    } catch (err) {
      console.error(`Failed to send to ${sub.platform}/${sub.channelId}:`, err);
    }
  }
}
