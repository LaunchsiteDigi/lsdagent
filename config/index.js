/**
 * Next.js config wrapper for thepopebot.
 * Enables instrumentation hook for cron scheduling on server start.
 *
 * Usage in user's next.config.mjs:
 *   import { withThepopebot } from 'thepopebot/config';
 *   export default withThepopebot({});
 *
 * @param {Object} nextConfig - User's Next.js config
 * @returns {Object} Enhanced Next.js config
 */
export function withThepopebot(nextConfig = {}) {
  return {
    ...nextConfig,
    distDir: process.env.NEXT_BUILD_DIR || '.next',
    transpilePackages: [
      'thepopebot',
      ...(nextConfig.transpilePackages || []),
    ],
    env: {
      ...nextConfig.env,
      NEXT_PUBLIC_CODE_WORKSPACE: process.env.CLAUDE_CODE_OAUTH_TOKEN && process.env.BETA ? 'true' : '',
      // Inline AUTH_SECRET/AUTH_TRUST_HOST into the bundle so Edge + Node.js runtimes
      // both have access (Vercel auto-gen sets these in process.env at build time)
      ...(process.env.AUTH_SECRET && { AUTH_SECRET: process.env.AUTH_SECRET }),
      ...(process.env.AUTH_TRUST_HOST && { AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST }),
      ...(process.env.DATABASE_PATH && { DATABASE_PATH: process.env.DATABASE_PATH }),
    },
    serverExternalPackages: [
      ...(nextConfig.serverExternalPackages || []),
      'better-sqlite3',
      'drizzle-orm',
    ],
  };
}
