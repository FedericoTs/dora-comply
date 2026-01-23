'use client';

/**
 * Notifications Settings Page
 *
 * Manage email and in-app notification preferences for compliance alerts.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  Building2,
  Shield,
  FileText,
  Settings,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/settings/notifications';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type NotificationDigest,
} from '@/lib/settings/notification-types';

// Category configuration
const NOTIFICATION_CATEGORIES = [
  {
    key: 'incidents' as const,
    label: 'Incidents',
    description: 'Incident reporting deadlines and status updates',
    icon: AlertTriangle,
    critical: true,
  },
  {
    key: 'vendors' as const,
    label: 'Vendors',
    description: 'Vendor assessment reminders and risk alerts',
    icon: Building2,
    critical: false,
  },
  {
    key: 'compliance' as const,
    label: 'Compliance',
    description: 'RoI deadlines and regulatory updates',
    icon: FileText,
    critical: true,
  },
  {
    key: 'security' as const,
    label: 'Security',
    description: 'MFA prompts, login alerts, and security notifications',
    icon: Shield,
    critical: false,
  },
  {
    key: 'system' as const,
    label: 'System',
    description: 'Platform updates and maintenance notices',
    icon: Settings,
    critical: false,
  },
];

const DIGEST_OPTIONS: { value: NotificationDigest; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immediate', description: 'Get notified right away' },
  { value: 'daily', label: 'Daily Digest', description: 'Summary sent once per day' },
  { value: 'weekly', label: 'Weekly Digest', description: 'Summary sent once per week' },
  { value: 'none', label: 'None', description: 'No email notifications' },
];

export default function NotificationsSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const result = await getNotificationPreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences with debounce
  const savePreferences = async (newPrefs: NotificationPreferences) => {
    setIsSaving(true);
    try {
      const result = await updateNotificationPreferences(newPrefs);
      if (result.success) {
        toast.success('Preferences saved');
      } else {
        toast.error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Update email enabled
  const handleEmailEnabledChange = (enabled: boolean) => {
    const newPrefs = {
      ...preferences,
      email: { ...preferences.email, enabled },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Update email digest
  const handleDigestChange = (digest: NotificationDigest) => {
    const newPrefs = {
      ...preferences,
      email: { ...preferences.email, digest },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Update email category
  const handleEmailCategoryChange = (category: keyof typeof preferences.email.categories, enabled: boolean) => {
    const newPrefs = {
      ...preferences,
      email: {
        ...preferences.email,
        categories: { ...preferences.email.categories, [category]: enabled },
      },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Update in-app enabled
  const handleInAppEnabledChange = (enabled: boolean) => {
    const newPrefs = {
      ...preferences,
      inApp: { ...preferences.inApp, enabled },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Update in-app category
  const handleInAppCategoryChange = (category: keyof typeof preferences.inApp.categories, enabled: boolean) => {
    const newPrefs = {
      ...preferences,
      inApp: {
        ...preferences.inApp,
        categories: { ...preferences.inApp.categories, [category]: enabled },
      },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Configure how you receive alerts for compliance deadlines and updates
          </p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle className="text-base">Email Notifications</CardTitle>
            </div>
            <Switch
              checked={preferences.email.enabled}
              onCheckedChange={handleEmailEnabledChange}
            />
          </div>
          <CardDescription>
            Receive important alerts and reminders via email
          </CardDescription>
        </CardHeader>
        {preferences.email.enabled && (
          <CardContent className="space-y-6">
            {/* Digest Frequency */}
            <div className="space-y-2">
              <Label>Email Frequency</Label>
              <Select
                value={preferences.email.digest}
                onValueChange={(value) => handleDigestChange(value as NotificationDigest)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIGEST_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Email Categories */}
            <div className="space-y-4">
              <Label>Email Categories</Label>
              <div className="space-y-3">
                {NOTIFICATION_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isEnabled = preferences.email.categories[category.key];

                  return (
                    <div
                      key={category.key}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{category.label}</span>
                            {category.critical && (
                              <Badge variant="outline" className="text-xs">
                                Critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleEmailCategoryChange(category.key, checked)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle className="text-base">In-App Notifications</CardTitle>
            </div>
            <Switch
              checked={preferences.inApp.enabled}
              onCheckedChange={handleInAppEnabledChange}
            />
          </div>
          <CardDescription>
            Show notifications within the DORA Comply platform
          </CardDescription>
        </CardHeader>
        {preferences.inApp.enabled && (
          <CardContent className="space-y-4">
            <Label>Notification Categories</Label>
            <div className="space-y-3">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isEnabled = preferences.inApp.categories[category.key];

                return (
                  <div
                    key={category.key}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{category.label}</span>
                          {category.critical && (
                            <Badge variant="outline" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleInAppCategoryChange(category.key, checked)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* DORA Compliance Note */}
      <Card className="border-info/50 bg-info/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-info" />
            <CardTitle className="text-base text-info">DORA Compliance Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Critical compliance notifications are designed to help you meet DORA deadlines:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <span><strong>Incident Reports:</strong> 24-hour initial notification, 72-hour intermediate report reminders</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <span><strong>RoI Submissions:</strong> Annual reporting deadline reminders</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <span><strong>Vendor Assessments:</strong> Contract renewal and review cycle alerts</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
