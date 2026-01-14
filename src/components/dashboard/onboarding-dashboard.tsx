import Link from 'next/link';
import {
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Target,
  AlertTriangle,
  Building2,
  BookOpen,
} from 'lucide-react';
import { getGreeting } from '@/lib/utils/greeting';

interface OnboardingStep {
  done: boolean;
  label: string;
}

interface OnboardingDashboardProps {
  firstName: string;
  onboardingSteps: OnboardingStep[];
  completedSteps: number;
  daysToDeadline: number;
  totalVendors: number;
  totalDocuments: number;
}

const stepConfigs = {
  'Add first vendor': {
    title: 'Add your first ICT provider',
    description: 'Start building your Register of Information by adding the vendors your organization relies on.',
    href: '/vendors/new',
    cta: 'Add Vendor',
    icon: Building2,
    time: '~2 min',
  },
  'Upload documents': {
    title: 'Upload vendor documentation',
    description: 'Add contracts, certifications, and SLAs to automatically extract compliance data.',
    href: '/documents',
    cta: 'Upload Documents',
    icon: FileText,
    time: '~3 min',
  },
  'Set up incidents': {
    title: 'Configure incident reporting',
    description: 'Set up your incident workflow to meet DORA\'s 4-hour initial reporting requirement.',
    href: '/incidents',
    cta: 'View Incidents',
    icon: AlertTriangle,
    time: '~2 min',
  },
  'Start RoI': {
    title: 'Complete your Register of Information',
    description: 'Review and finalize your RoI data for submission to regulators.',
    href: '/roi',
    cta: 'Open RoI',
    icon: BookOpen,
    time: '~5 min',
  },
} as const;

export function OnboardingDashboard({
  firstName,
  onboardingSteps,
  completedSteps,
  daysToDeadline,
  totalVendors,
  totalDocuments,
}: OnboardingDashboardProps) {
  const nextStep = onboardingSteps.find(s => !s.done);
  const nextStepConfig = stepConfigs[nextStep?.label as keyof typeof stepConfigs] || stepConfigs['Add first vendor'];
  const NextIcon = nextStepConfig.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8 animate-in">
        <h1 className="text-2xl font-semibold mb-2">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Let&apos;s get your DORA compliance program set up.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="mb-8 animate-in">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">Setup Progress</span>
          <span className="font-medium">{completedSteps} of {onboardingSteps.length} steps</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {onboardingSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={`text-xs ${step.done ? 'text-success' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Step Hero Card */}
      <div className="card-premium p-8 mb-8 animate-slide-up bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
        <div className="flex items-center gap-2 text-primary mb-4">
          <Target className="h-5 w-5" />
          <span className="text-sm font-medium">Your Next Step</span>
          <span className="text-xs text-muted-foreground ml-auto">{nextStepConfig.time}</span>
        </div>

        <div className="flex items-start gap-6">
          <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
            <NextIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-2">{nextStepConfig.title}</h2>
            <p className="text-muted-foreground mb-6">{nextStepConfig.description}</p>
            <Link href={nextStepConfig.href} className="btn-primary inline-flex">
              {nextStepConfig.cta}
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Deadline Reminder */}
      <div className="card-elevated p-6 mb-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium">RoI Submission Deadline</p>
              <p className="text-sm text-muted-foreground">April 30, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold">{daysToDeadline}</p>
            <p className="text-sm text-muted-foreground">days left</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        <Link href="/vendors" className="card-elevated p-4 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="font-medium text-sm">Vendors</p>
              <p className="text-xs text-muted-foreground">{totalVendors} registered</p>
            </div>
          </div>
        </Link>
        <Link href="/documents" className="card-elevated p-4 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="font-medium text-sm">Documents</p>
              <p className="text-xs text-muted-foreground">{totalDocuments} uploaded</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Help Text */}
      <p className="text-center text-sm text-muted-foreground mt-8 animate-in">
        Need help? Use the <span className="font-medium">AI Copilot</span> in the bottom right corner.
      </p>
    </div>
  );
}
