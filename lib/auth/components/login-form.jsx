'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {justCreated && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Account created. Sign in with your new credentials.
          </p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/login" className="underline underline-offset-4 hover:text-foreground">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
