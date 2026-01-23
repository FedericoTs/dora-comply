'use client';

/**
 * Branding Settings Page
 *
 * Customize organization branding for the vendor portal including:
 * - Logo upload
 * - Color customization
 * - Welcome messages
 * - Footer and support info
 */

import { useRef, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Upload,
  Trash2,
  Palette,
  Type,
  ImageIcon,
  Eye,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useBrandingSettings } from '@/hooks/use-branding-settings';
import { COLOR_PRESETS, type BrandingFormData } from '@/lib/settings/branding-types';

export default function BrandingSettingsPage() {
  const {
    form,
    isLoading,
    isSaving,
    isUploadingLogo,
    isDeletingLogo,
    logoUrl,
    handleSubmit,
    handleLogoUpload,
    handleLogoDelete,
    handleReset,
    applyColorPreset,
  } = useBrandingSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const watchPrimary = form.watch('primaryColor');
  const watchAccent = form.watch('accentColor');
  const watchTitle = form.watch('portalWelcomeTitle');
  const watchMessage = form.watch('portalWelcomeMessage');
  const watchLogoPosition = form.watch('portalLogoPosition');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">Vendor Portal Branding</h2>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of your vendor portal with your organization&apos;s branding
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4" />
                Logo
              </CardTitle>
              <CardDescription>
                Upload your organization logo. PNG, JPEG, SVG, or WebP up to 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/50',
                    'h-24 w-48 overflow-hidden',
                    !logoUrl && 'border-muted-foreground/25'
                  )}
                >
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Organization logo"
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No logo</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {logoUrl ? 'Replace Logo' : 'Upload Logo'}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleLogoDelete}
                      disabled={isDeletingLogo}
                    >
                      {isDeletingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Logo Position */}
              <FormField
                control={form.control}
                name="portalLogoPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Position</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Where to display the logo in the portal header
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Colors Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Choose colors that match your brand identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Presets */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Quick Presets
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive =
                      watchPrimary === preset.primary && watchAccent === preset.accent;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyColorPreset(preset.primary, preset.accent)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors',
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-sm">{preset.name}</span>
                        {isActive && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="#059669"
                              className="pl-10 font-mono"
                            />
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded border-0 p-0"
                            />
                          </div>
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for buttons and primary accents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="#10B981"
                              className="pl-10 font-mono"
                            />
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded border-0 p-0"
                            />
                          </div>
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for highlights and secondary elements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4" />
                Welcome Content
              </CardTitle>
              <CardDescription>
                Customize the welcome message shown to vendors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="portalWelcomeTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Welcome to our Vendor Portal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portalWelcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Please complete the requested questionnaire..."
                      />
                    </FormControl>
                    <FormDescription>
                      Brief instructions or context for vendors accessing the portal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="portalFooterText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="e.g., © 2026 Your Company. All rights reserved."
                      />
                    </FormControl>
                    <FormDescription>
                      Displayed at the bottom of the portal pages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portalSupportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        value={field.value || ''}
                        placeholder="support@yourcompany.com"
                      />
                    </FormControl>
                    <FormDescription>
                      Contact email shown for vendor support inquiries
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preview Dialog */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Preview Vendor Portal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Portal Preview</DialogTitle>
                <DialogDescription>
                  This is how your vendor portal will appear to vendors
                </DialogDescription>
              </DialogHeader>
              <div
                className="rounded-lg border overflow-hidden"
                style={
                  {
                    '--preview-primary': watchPrimary,
                    '--preview-accent': watchAccent,
                  } as React.CSSProperties
                }
              >
                {/* Preview Header */}
                <div
                  className="p-4 border-b bg-background"
                  style={{ backgroundColor: watchPrimary + '08' }}
                >
                  <div
                    className={cn(
                      'flex items-center',
                      watchLogoPosition === 'center' && 'justify-center',
                      watchLogoPosition === 'right' && 'justify-end'
                    )}
                  >
                    {logoUrl ? (
                      <div className="relative h-8 w-32">
                        <Image
                          src={logoUrl}
                          alt="Logo preview"
                          fill
                          className="object-contain object-left"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded"
                          style={{ backgroundColor: watchPrimary }}
                        />
                        <span className="font-semibold">Your Company</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-8 text-center space-y-4">
                  <h2 className="text-xl font-semibold">{watchTitle}</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {watchMessage}
                  </p>
                  <Button
                    type="button"
                    className="mt-4"
                    style={{ backgroundColor: watchPrimary }}
                  >
                    Get Started
                  </Button>
                </div>

                {/* Preview Footer */}
                {form.watch('portalFooterText') && (
                  <div className="p-4 border-t bg-muted/30 text-center text-sm text-muted-foreground">
                    {form.watch('portalFooterText')}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
