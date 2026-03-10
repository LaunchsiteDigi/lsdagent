import { getPageAuthState } from '../../lib/auth/index.js';
import { AsciiLogo, SetupForm, LoginForm } from '../../lib/auth/components/index.js';

export default async function LoginPage() {
  const { needsSetup } = await getPageAuthState();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <AsciiLogo />
      {needsSetup ? <SetupForm /> : <LoginForm />}
    </main>
  );
}
