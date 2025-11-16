import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Nou AI',
  description: 'Log in to your Nou AI account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
