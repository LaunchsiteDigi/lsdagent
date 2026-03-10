import { randomUUID } from 'crypto';
import { eq, desc, asc } from 'drizzle-orm';
import { getDb } from './index.js';
import { chats, messages } from './schema.js';

/**
 * Create a new chat.
 * @param {string} userId
 * @param {string} [title='New Chat']
 * @param {string} [id] - Optional chat ID (UUID). Generated if not provided.
 * @returns {Promise<object>} The created chat
 */
export async function createChat(userId, title = 'New Chat', id = null) {
  const db = getDb();
  const now = Date.now();
  const chat = {
    id: id || randomUUID(),
    userId,
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(chats).values(chat).run();
  return chat;
}

/**
 * Get all chats for a user, ordered by most recently updated.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getChatsByUser(userId) {
  const db = getDb();
  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .all();
}

/**
 * Get a single chat by ID.
 * @param {string} chatId
 * @returns {Promise<object|undefined>}
 */
export async function getChatById(chatId) {
  const db = getDb();
  return await db.select().from(chats).where(eq(chats.id, chatId)).get();
}

/**
 * Get a single chat by its code_workspace_id.
 * @param {string} workspaceId
 * @returns {Promise<object|undefined>}
 */
export async function getChatByWorkspaceId(workspaceId) {
  const db = getDb();
  return await db.select().from(chats).where(eq(chats.codeWorkspaceId, workspaceId)).get();
}

/**
 * Update a chat's title.
 * @param {string} chatId
 * @param {string} title
 */
export async function updateChatTitle(chatId, title) {
  const db = getDb();
  await db.update(chats)
    .set({ title, updatedAt: Date.now() })
    .where(eq(chats.id, chatId))
    .run();
}

/**
 * Toggle a chat's starred status.
 * @param {string} chatId
 * @returns {Promise<number>} The new starred value (0 or 1)
 */
export async function toggleChatStarred(chatId) {
  const db = getDb();
  const chat = await db.select({ starred: chats.starred }).from(chats).where(eq(chats.id, chatId)).get();
  const newValue = chat?.starred ? 0 : 1;
  await db.update(chats)
    .set({ starred: newValue })
    .where(eq(chats.id, chatId))
    .run();
  return newValue;
}

/**
 * Delete a chat and all its messages.
 * @param {string} chatId
 */
export async function deleteChat(chatId) {
  const db = getDb();
  await db.delete(messages).where(eq(messages.chatId, chatId)).run();
  await db.delete(chats).where(eq(chats.id, chatId)).run();
}

/**
 * Delete all chats and messages for a user.
 * @param {string} userId
 */
export async function deleteAllChatsByUser(userId) {
  const db = getDb();
  const userChats = await db
    .select({ id: chats.id })
    .from(chats)
    .where(eq(chats.userId, userId))
    .all();

  for (const chat of userChats) {
    await db.delete(messages).where(eq(messages.chatId, chat.id)).run();
  }
  await db.delete(chats).where(eq(chats.userId, userId)).run();
}

/**
 * Get all messages for a chat, ordered by creation time.
 * @param {string} chatId
 * @returns {Promise<object[]>}
 */
export async function getMessagesByChatId(chatId) {
  const db = getDb();
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))
    .all();
}

/**
 * Link a chat to a code workspace.
 * @param {string} chatId
 * @param {string} workspaceId
 */
export async function linkChatToWorkspace(chatId, workspaceId) {
  const db = getDb();
  await db.update(chats)
    .set({ codeWorkspaceId: workspaceId, updatedAt: Date.now() })
    .where(eq(chats.id, chatId))
    .run();
}

/**
 * Save a message to a chat. Also updates the chat's updatedAt timestamp.
 * @param {string} chatId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 * @param {string} [id] - Optional message ID
 * @returns {Promise<object>} The created message
 */
export async function saveMessage(chatId, role, content, id = null) {
  const db = getDb();
  const now = Date.now();
  const message = {
    id: id || randomUUID(),
    chatId,
    role,
    content,
    createdAt: now,
  };
  await db.insert(messages).values(message).run();
  await db.update(chats).set({ updatedAt: now }).where(eq(chats.id, chatId)).run();
  return message;
}
