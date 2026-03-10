import { auth } from '../../../lib/auth/index.js';
import { CodePage } from '../../../lib/code/index.js';

export default async function CodeRoute({ params }) {
  const session = await auth();
  const { codeWorkspaceId } = await params;
  return <CodePage session={session} codeWorkspaceId={codeWorkspaceId} />;
}
