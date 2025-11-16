import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Nou AI',
  description: 'Create a new Nou AI account.',
};

export default function SignupPage() {
  return <SignupForm />;
}
