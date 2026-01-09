'use client';

import * as React from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MFAQRCodeProps {
  qrCode: string; // Data URI for QR code image
  secret: string; // Base32 secret for manual entry
  className?: string;
}

export function MFAQRCode({ qrCode, secret, className }: MFAQRCodeProps) {
  const [showSecret, setShowSecret] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy secret');
    }
  };

  // Format secret with spaces for readability
  const formattedSecret = secret.replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className={cn('space-y-4', className)}>
      {/* QR Code Image */}
      <div className="flex justify-center">
        <div className="p-4 bg-white rounded-lg shadow-sm border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Scan this QR code with your authenticator app"
            className="w-48 h-48"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Scan the QR code with your authenticator app
        </p>
        <p className="text-xs text-muted-foreground">
          (Google Authenticator, 1Password, Authy, etc.)
        </p>
      </div>

      {/* Manual Entry Option */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSecret(!showSecret)}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {showSecret ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide manual entry code
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Can&apos;t scan? Enter code manually
            </>
          )}
        </Button>

        {showSecret && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Enter this code in your authenticator app:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="font-mono text-sm bg-background px-2 py-1 rounded border">
                {formattedSecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copySecret}
                className="h-8 w-8"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
