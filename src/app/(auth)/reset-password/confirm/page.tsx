import { Metadata } from 'next';
import { NewPasswordForm } from './new-password-form';

export const metadata: Metadata = {
  title: 'Set New Password | DORA Comply',
  description: 'Create a new password for your account',
};

export default function NewPasswordPage() {
  return <NewPasswordForm />;
}
