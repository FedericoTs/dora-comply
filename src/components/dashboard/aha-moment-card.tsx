import Link from 'next/link';
import { PartyPopper, Upload } from 'lucide-react';

export function AhaMomentCard() {
  return (
    <div className="mb-8 animate-in">
      <div className="card-premium p-6 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">
              Great start! Your first vendor is registered
            </h3>
            <p className="text-muted-foreground">
              You&apos;re on your way to DORA compliance. Next, upload contracts and certifications to build your Register of Information.
            </p>
          </div>
          <Link href="/documents" className="btn-primary shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
