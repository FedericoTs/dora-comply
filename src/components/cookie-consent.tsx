'use client';

/**
 * Cookie Consent Banner
 *
 * GDPR-compliant cookie consent component that:
 * - Displays on first visit
 * - Allows granular consent (essential, analytics, marketing)
 * - Persists preference in localStorage
 * - Blocks non-essential cookies until consent
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Settings2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CONSENT_KEY = 'dora-comply-cookie-consent';
const CONSENT_VERSION = '1.0'; // Increment when policy changes

export type CookieConsent = {
  version: string;
  timestamp: string;
  essential: true; // Always true, required
  analytics: boolean;
  marketing: boolean;
};

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as CookieConsent;

    // If version changed, need new consent
    if (consent.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    return consent;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: Omit<CookieConsent, 'version' | 'timestamp' | 'essential'>): void {
  const fullConsent: CookieConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true,
    ...consent,
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: fullConsent }));
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Check if consent already given
    const consent = getCookieConsent();
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true, marketing: true });
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    saveCookieConsent({ analytics: false, marketing: false });
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveCookieConsent({ analytics, marketing });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border bg-white shadow-2xl">
          {!showSettings ? (
            // Simple view
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">We value your privacy</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We use cookies to enhance your browsing experience, analyze site traffic, and
                    personalize content. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                    Read our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/gdpr" className="text-primary hover:underline">
                      Cookie Policy
                    </Link>{' '}
                    for more information.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleAcceptAll} className="shadow-lg shadow-primary/20">
                      Accept All
                    </Button>
                    <Button variant="outline" onClick={handleAcceptEssential}>
                      Essential Only
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="text-muted-foreground"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Settings view
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Settings2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Cookie Preferences</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Essential Cookies */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Essential Cookies</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        Required
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <div className="flex h-6 w-11 items-center rounded-full bg-primary px-1">
                    <div className="h-4 w-4 rounded-full bg-white translate-x-5" />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50/50 transition-colors">
                  <div>
                    <span className="font-medium">Analytics Cookies</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <button
                    onClick={() => setAnalytics(!analytics)}
                    className={cn(
                      "flex h-6 w-11 items-center rounded-full px-1 transition-colors",
                      analytics ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-white transition-transform",
                        analytics ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50/50 transition-colors">
                  <div>
                    <span className="font-medium">Marketing Cookies</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Used to deliver relevant advertisements and track campaign performance.
                    </p>
                  </div>
                  <button
                    onClick={() => setMarketing(!marketing)}
                    className={cn(
                      "flex h-6 w-11 items-center rounded-full px-1 transition-colors",
                      marketing ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-white transition-transform",
                        marketing ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSavePreferences} className="shadow-lg shadow-primary/20">
                  <Check className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
                <Button variant="outline" onClick={handleAcceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
