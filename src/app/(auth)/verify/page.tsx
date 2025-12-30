import { Metadata } from 'next';
import { VerifyContent } from './verify-content';

export const metadata: Metadata = {
  title: 'Verify Email | DORA Comply',
  description: 'Check your email to verify your account',
};

interface VerifyPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  return <VerifyContent email={params.email} />;
}
