import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | SecureLogin',
  description: 'Reset your SecureLogin password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
