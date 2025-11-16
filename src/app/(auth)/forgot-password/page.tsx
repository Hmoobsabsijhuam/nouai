import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Nou AI',
  description: 'Reset your Nou AI password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
