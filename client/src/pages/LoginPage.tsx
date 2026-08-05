import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { loginThunk } from '@/store/auth/auth.thunk';
import { clearAuthError } from '@/store/auth/auth.slice';

export function LoginPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loginLoading = useAppSelector((state) => state.auth.loginLoading);
  const authError = useAppSelector((state) => state.auth.authError);
  const [email, setEmail] = useState('seeker@viewings.demo');
  const [password, setPassword] = useState('DemoPass123!');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <AuthLayout>
      <Card padding="md" className="w-full">
        <p className="eyebrow text-[var(--color-text-muted)]">Authentication</p>
        <h1 className="page-title mt-2">Sign in</h1>
        <p className="mt-1.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          Demo: seeker@viewings.demo
        </p>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            size="sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            reserveErrorSpace
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            size="sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            reserveErrorSpace
            error={authError ?? undefined}
            required
          />
          <Button type="submit" size="sm" fullWidth loading={loginLoading}>
            Sign in
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
