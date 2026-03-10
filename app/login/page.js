import { getPageAuthState } from '../../lib/auth/index.js';
import { AsciiLogo, SetupForm, LoginForm } from '../../lib/auth/components/index.js';

export default async function LoginPage() {
  let needsSetup = true;
  try {
    ({ needsSetup } = await getPageAuthState());
  } catch {
    // DB unavailable (e.g. Vercel serverless) — default to setup form
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <AsciiLogo />
      {needsSetup ? <SetupForm /> : <LoginForm />}
    </main>
  );
}
