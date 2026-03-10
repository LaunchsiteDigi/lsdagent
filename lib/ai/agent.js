import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { SystemMessage } from '@langchain/core/messages';
import { createModel } from './model.js';
import { createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool, getSkillDetailsTool, createStartCodingTool, createGetRepositoryDetailsTool } from './tools.js';
import { jobPlanningMd, codePlanningMd, thepopebotDb } from '../paths.js';
import { render_md } from '../utils/render-md.js';
import { createWebSearchTool, getProvider } from './web-search.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let _agent = null;

/**
 * Create a checkpointer — SqliteSaver if available, MemorySaver fallback.
 * SqliteSaver requires better-sqlite3 (native addon, optional on serverless).
 */
function createCheckpointer() {
  try {
    const { SqliteSaver } = require('@langchain/langgraph-checkpoint-sqlite');
    return SqliteSaver.fromConnString(thepopebotDb);
  } catch {
    // better-sqlite3 not available (e.g. Vercel serverless) — use in-memory
    return new MemorySaver();
  }
}

/**
 * Get or create the LangGraph job agent singleton.
 * Uses createReactAgent which handles the tool loop automatically.
 * Prompt is a function so {{datetime}} resolves fresh each invocation.
 */
export async function getJobAgent() {
  if (!_agent) {
    const model = await createModel();
    const tools = [createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool, getSkillDetailsTool];

    const webSearchTool = await createWebSearchTool();
    if (webSearchTool) {
      tools.push(webSearchTool);
      console.log(`[agent] Web search enabled (provider: ${getProvider()})`);
    }

    const checkpointer = createCheckpointer();

    _agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      prompt: (state) => [new SystemMessage(render_md(jobPlanningMd)), ...state.messages],
    });
  }
  return _agent;
}

/**
 * Reset the agent singleton (e.g., when config changes).
 */
export function resetAgent() {
  _agent = null;
}

const _codeAgents = new Map();

/**
 * Get or create a code agent for a specific chat/workspace.
 * Each code chat gets its own agent with unique start_coding tool bindings.
 * @param {object} context
 * @param {string} context.repo - GitHub repo
 * @param {string} context.branch - Git branch
 * @param {string} context.workspaceId - Pre-created workspace row ID
 * @param {string} context.chatId - Chat thread ID
 * @returns {Promise<object>} LangGraph agent
 */
export async function getCodeAgent({ repo, branch, workspaceId, chatId }) {
  if (_codeAgents.has(chatId)) {
    return _codeAgents.get(chatId);
  }

  const model = await createModel();
  const startCodingTool = createStartCodingTool({ repo, branch, workspaceId });
  const getRepoDetailsTool = createGetRepositoryDetailsTool({ repo, branch });
  const tools = [startCodingTool, getRepoDetailsTool];

  const webSearchTool = await createWebSearchTool();
  if (webSearchTool) {
    tools.push(webSearchTool);
    console.log(`[agent] Web search enabled for code agent (provider: ${getProvider()})`);
  }

  const checkpointer = createCheckpointer();

  const agent = createReactAgent({
    llm: model,
    tools,
    checkpointSaver: checkpointer,
    prompt: (state) => [new SystemMessage(render_md(codePlanningMd)), ...state.messages],
  });

  _codeAgents.set(chatId, agent);
  return agent;
}
