import Link from 'next/link';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

interface StepItemProps {
  step: number;
  title: string;
  href: string;
  completed: boolean;
}

function StepItem({ step, title, href, completed }: StepItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div
        className={`
          h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
          ${completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
          }
        `}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

const STEPS = [
  { step: 1, title: 'Add your first ICT third-party provider', href: '/vendors/new' },
  { step: 2, title: 'Upload vendor contracts and certifications', href: '/documents' },
  { step: 3, title: 'Set up incident reporting workflows', href: '/incidents' },
  { step: 4, title: 'Complete your Register of Information', href: '/roi' },
];

interface GettingStartedCardProps {
  stepsCompleted: boolean[];
}

export function GettingStartedCard({ stepsCompleted }: GettingStartedCardProps) {
  const completedCount = stepsCompleted.filter(Boolean).length;
  const allCompleted = completedCount === STEPS.length;

  if (allCompleted) {
    return (
      <div data-tour="getting-started" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
        <div className="py-8 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-bounce">
              <span className="text-xs">🎉</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You&apos;ve completed all the essential steps. Your DORA compliance journey is off to a great start.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/compliance/trends" className="btn-primary">
              View Compliance Trends
            </Link>
            <Link href="/vendors" className="btn-secondary">
              Manage Vendors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="getting-started" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3>Getting Started</h3>
        <span className="badge badge-default">
          {completedCount}/{STEPS.length} completed
        </span>
      </div>
      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <StepItem
            key={step.step}
            step={step.step}
            title={step.title}
            href={step.href}
            completed={stepsCompleted[index]}
          />
        ))}
      </div>
      {completedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-primary">
              {Math.round((completedCount / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
