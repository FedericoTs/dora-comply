import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className={cn('w-full max-w-md shadow-lg', className)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}
