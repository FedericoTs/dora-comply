import { Suspense } from 'react';
import { Metadata } from 'next';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us | DORA Comply',
  description: 'Get in touch with the DORA Comply team for platform access, demos, or questions about DORA compliance.',
};

function ContactFormLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<ContactFormLoading />}>
      <ContactForm />
    </Suspense>
  );
}
