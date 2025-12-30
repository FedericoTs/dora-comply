import { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password | DORA Comply',
  description: 'Reset your DORA Comply password',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
