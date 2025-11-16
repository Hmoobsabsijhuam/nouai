import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | SecureLogin',
  description: 'Create a new SecureLogin account.',
};

export default function SignupPage() {
  return <SignupForm />;
}
