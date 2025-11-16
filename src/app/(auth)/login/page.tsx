import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | SecureLogin',
  description: 'Log in to your SecureLogin account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
