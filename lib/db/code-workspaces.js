import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from './index.js';
import { codeWorkspaces } from './schema.js';

/**
 * Create a new code workspace.
 * @param {string} userId
 * @param {object} options
 * @param {string} [options.containerName] - Docker container DNS name (null until launched)
 * @param {string} [options.repo] - GitHub repo full name (e.g. "owner/repo")
 * @param {string} [options.branch] - Git branch name
 * @param {string} [options.title='Code Workspace']
 * @param {string} [options.codingAgent='claude-code'] - Coding agent identifier
 * @param {string} [options.id] - Optional ID (UUID). Generated if not provided.
 * @returns {Promise<object>} The created workspace
 */
export async function createCodeWorkspace(userId, { containerName = null, repo = null, branch = null, title = 'Code Workspace', codingAgent = 'claude-code', id = null } = {}) {
  const db = await getDb();
  const now = Date.now();
  const workspace = {
    id: id || randomUUID(),
    userId,
    containerName,
    repo,
    branch,
    title,
    codingAgent,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(codeWorkspaces).values(workspace).run();
  return workspace;
}

/**
 * Update the container name on an existing workspace (when Docker launches).
 * @param {string} id - Workspace ID
 * @param {string} containerName - Docker container name
 */
export async function updateContainerName(id, containerName) {
  const db = await getDb();
  await db.update(codeWorkspaces)
    .set({ containerName, updatedAt: Date.now() })
    .where(eq(codeWorkspaces.id, id))
    .run();
}

/**
 * Get a single code workspace by ID.
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function getCodeWorkspaceById(id) {
  const db = await getDb();
  return await db.select().from(codeWorkspaces).where(eq(codeWorkspaces.id, id)).get();
}

/**
 * Get all code workspaces for a user, ordered by most recently updated.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getCodeWorkspacesByUser(userId) {
  const db = await getDb();
  return await db
    .select()
    .from(codeWorkspaces)
    .where(eq(codeWorkspaces.userId, userId))
    .orderBy(desc(codeWorkspaces.updatedAt))
    .all();
}

/**
 * Update a code workspace's title.
 * @param {string} id
 * @param {string} title
 */
export async function updateCodeWorkspaceTitle(id, title) {
  const db = await getDb();
  await db.update(codeWorkspaces)
    .set({ title, updatedAt: Date.now() })
    .where(eq(codeWorkspaces.id, id))
    .run();
}

/**
 * Toggle a code workspace's starred status.
 * @param {string} id
 * @returns {Promise<number>} The new starred value (0 or 1)
 */
export async function toggleCodeWorkspaceStarred(id) {
  const db = await getDb();
  const workspace = await db.select({ starred: codeWorkspaces.starred }).from(codeWorkspaces).where(eq(codeWorkspaces.id, id)).get();
  const newValue = workspace?.starred ? 0 : 1;
  await db.update(codeWorkspaces)
    .set({ starred: newValue })
    .where(eq(codeWorkspaces.id, id))
    .run();
  return newValue;
}

/**
 * Update the branch on an existing workspace (e.g. after creating a feature branch).
 * @param {string} id - Workspace ID
 * @param {string} branch - Git branch name
 */
export async function updateBranch(id, branch) {
  const db = await getDb();
  await db.update(codeWorkspaces)
    .set({ branch, updatedAt: Date.now() })
    .where(eq(codeWorkspaces.id, id))
    .run();
}

/**
 * Delete a code workspace.
 * @param {string} id
 */
export async function deleteCodeWorkspace(id) {
  const db = await getDb();
  await db.delete(codeWorkspaces).where(eq(codeWorkspaces.id, id)).run();
}
