'use client';

import { useState, useMemo } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  analyzePassword,
  getStrengthColor,
  getStrengthTextColor,
  type PasswordStrength,
} from '@/lib/auth/password';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  showRequirements?: boolean;
  userInputs?: string[];
}

export function PasswordInput({
  showStrength = false,
  showRequirements = false,
  userInputs = [],
  className,
  value,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo<PasswordStrength | null>(() => {
    if (!showStrength && !showRequirements) return null;
    const password = typeof value === 'string' ? value : '';
    if (!password) return null;
    return analyzePassword(password, userInputs);
  }, [value, showStrength, showRequirements, userInputs]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          value={value}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      </div>

      {showStrength && strength && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  level <= strength.score
                    ? getStrengthColor(strength.score)
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            <span className={getStrengthTextColor(strength.score)}>
              {strength.label}
            </span>
            <span className="text-muted-foreground">
              Crack time: {strength.crackTime}
            </span>
          </div>
          {strength.feedback.warning && (
            <p className="text-xs text-amber-600">{strength.feedback.warning}</p>
          )}
        </div>
      )}

      {showRequirements && strength && (
        <ul className="space-y-1">
          {strength.requirements.map((req) => (
            <li
              key={req.id}
              className={cn(
                'flex items-center gap-2 text-xs',
                req.met ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
