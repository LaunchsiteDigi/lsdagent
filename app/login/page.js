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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AsciiLogo />
        {needsSetup ? <SetupForm /> : <LoginForm />}
      </div>
    </div>
  );
}
