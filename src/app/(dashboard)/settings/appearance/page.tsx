'use client';

/**
 * Appearance Settings Page
 *
 * Manage theme, locale, date/time format, and display preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Calendar,
  Clock,
  Globe,
  LayoutGrid,
  Loader2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import {
  getAppearancePreferences,
  updateAppearancePreferences,
  type AppearancePreferences,
  type Theme,
  type DateFormat,
  type TimeFormat,
  type Locale,
  DEFAULT_APPEARANCE_PREFERENCES,
} from '@/lib/settings/appearance';

// Theme options with icons
const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Match your system settings' },
];

// Date format options
const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'iso', label: 'ISO 8601', example: '2025-01-09' },
  { value: 'eu', label: 'European', example: '09/01/2025' },
  { value: 'us', label: 'US', example: '01/09/2025' },
];

// Time format options
const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string; example: string }[] = [
  { value: '24h', label: '24-hour', example: '14:30' },
  { value: '12h', label: '12-hour', example: '2:30 PM' },
];

// Locale options
const LOCALE_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: 'GB' },
  { value: 'de', label: 'Deutsch', flag: 'DE' },
  { value: 'fr', label: 'Francais', flag: 'FR' },
  { value: 'es', label: 'Espanol', flag: 'ES' },
  { value: 'it', label: 'Italiano', flag: 'IT' },
];

export default function AppearanceSettingsPage() {
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<AppearancePreferences>(
    DEFAULT_APPEARANCE_PREFERENCES
  );
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const result = await getAppearancePreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
        // Sync theme with next-themes
        if (result.data.theme) {
          setTheme(result.data.theme);
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load appearance preferences');
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences
  const savePreferences = async (newPrefs: AppearancePreferences) => {
    setIsSaving(true);
    try {
      const result = await updateAppearancePreferences(newPrefs);
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

  // Handle theme change
  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    const newPrefs = { ...preferences, theme };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Handle date format change
  const handleDateFormatChange = (dateFormat: DateFormat) => {
    const newPrefs = { ...preferences, dateFormat };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Handle time format change
  const handleTimeFormatChange = (timeFormat: TimeFormat) => {
    const newPrefs = { ...preferences, timeFormat };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Handle locale change
  const handleLocaleChange = (locale: Locale) => {
    const newPrefs = { ...preferences, locale };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Handle compact mode change
  const handleCompactModeChange = (compactMode: boolean) => {
    const newPrefs = { ...preferences, compactMode };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  if (isLoading || !mounted) {
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
          <h2 className="text-lg font-medium">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how DORA Comply looks and feels
          </p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle className="text-base">Theme</CardTitle>
          </div>
          <CardDescription>
            Select your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.theme}
            onValueChange={(value) => handleThemeChange(value as Theme)}
            className="grid grid-cols-3 gap-4"
          >
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Label
                  key={option.value}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    preferences.theme === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <div className={`p-2 rounded-full ${
                    preferences.theme === option.value ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      preferences.theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date & Time Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-base">Date & Time Format</CardTitle>
          </div>
          <CardDescription>
            Choose how dates and times are displayed throughout the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Format */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Format
            </Label>
            <RadioGroup
              value={preferences.dateFormat}
              onValueChange={(value) => handleDateFormatChange(value as DateFormat)}
              className="space-y-2"
            >
              {DATE_FORMAT_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    preferences.dateFormat === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {option.example}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Time Format */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Format
            </Label>
            <RadioGroup
              value={preferences.timeFormat}
              onValueChange={(value) => handleTimeFormatChange(value as TimeFormat)}
              className="space-y-2"
            >
              {TIME_FORMAT_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    preferences.timeFormat === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {option.example}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle className="text-base">Language</CardTitle>
          </div>
          <CardDescription>
            Select your preferred language for the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences.locale}
            onValueChange={(value) => handleLocaleChange(value as Locale)}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            More languages coming soon. Currently, only English is fully supported.
          </p>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            <CardTitle className="text-base">Display Options</CardTitle>
          </div>
          <CardDescription>
            Adjust the visual density of the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use smaller spacing and more condensed layouts
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={preferences.compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help & Onboarding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <CardTitle className="text-base">Help & Onboarding</CardTitle>
          </div>
          <CardDescription>
            Guides and tutorials to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Product Tour</Label>
              <p className="text-sm text-muted-foreground">
                Take a guided tour of the dashboard and key features
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear tour completion status and redirect to dashboard
                try {
                  localStorage.removeItem('dora-comply-tour-completed');
                  toast.success('Tour reset! Redirecting to dashboard...');
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 500);
                } catch {
                  toast.error('Failed to reset tour');
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
