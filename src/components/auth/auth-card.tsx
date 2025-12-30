import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  className,
  footer,
}: AuthCardProps) {
  return (
    <div className={cn('card-premium w-full max-w-md', className)}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
