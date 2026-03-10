import crypto from 'crypto';
import { withThepopebot } from './config/index.js';

// On Vercel, auto-configure missing env vars at build time so they get
// inlined into the bundle for both Edge (middleware) and Node.js runtimes.
if (process.env.VERCEL && !process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = crypto.randomBytes(32).toString('base64');
}
if (process.env.VERCEL && !process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = 'true';
}
if (process.env.VERCEL && !process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = '/tmp/thepopebot.sqlite';
}

export default withThepopebot({});
