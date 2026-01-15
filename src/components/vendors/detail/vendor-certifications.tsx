'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Award,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Building2,
  ExternalLink,
  Trash2,
  Loader2,
  Clock,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type VendorCertification,
  type CertificationStatus,
  ISO_STANDARDS,
  formatCertificationStatus,
  getStandardRelevance,
} from '@/lib/certifications/types';

interface VendorCertificationsProps {
  vendorId: string;
  vendorName: string;
  certifications: VendorCertification[];
  onRefresh?: () => void;
}

const CERTIFICATION_OPTIONS = Object.entries(ISO_STANDARDS).map(([key, value]) => ({
  value: key,
  label: `${key} - ${value.name}`,
  relevance: value.relevance,
}));

// Status options for future use in dropdown
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STATUS_OPTIONS: { value: CertificationStatus; label: string }[] = [
  { value: 'valid', label: 'Valid' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export function VendorCertifications({
  vendorId,
  vendorName,
  certifications,
  onRefresh,
}: VendorCertificationsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    standard: '',
    standard_version: '',
    certificate_number: '',
    certification_body: '',
    accreditation_body: '',
    valid_from: '',
    valid_until: '',
    status: 'valid' as CertificationStatus,
    scope: '',
    certificate_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vendor_id: vendorId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to add certification');
      }

      toast.success('Certification Added', {
        description: `${formData.standard} certification has been added.`,
      });

      setIsAddDialogOpen(false);
      setFormData({
        standard: '',
        standard_version: '',
        certificate_number: '',
        certification_body: '',
        accreditation_body: '',
        valid_from: '',
        valid_until: '',
        status: 'valid',
        scope: '',
        certificate_url: '',
      });

      onRefresh?.();
    } catch (error) {
      toast.error('Failed to Add', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (certId: string, standard: string) => {
    if (!confirm(`Are you sure you want to delete the ${standard} certification?`)) {
      return;
    }

    setDeletingId(certId);

    try {
      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to delete certification');
      }

      toast.success('Certification Deleted', {
        description: `${standard} certification has been removed.`,
      });

      onRefresh?.();
    } catch (error) {
      toast.error('Failed to Delete', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: CertificationStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'expired':
      case 'suspended':
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-error" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getRelevanceBadge = (standard: string) => {
    const relevance = getStandardRelevance(standard);
    switch (relevance) {
      case 'critical':
        return (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            Critical for DORA
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/20">
            Recommended
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            ISO Certifications
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Certification</DialogTitle>
                <DialogDescription>
                  Add an ISO or compliance certification for {vendorName}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="standard">Standard *</Label>
                    <Select
                      value={formData.standard}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, standard: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select standard" />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <span>{opt.value}</span>
                              {opt.relevance === 'critical' && (
                                <Badge variant="secondary" className="text-xs">
                                  Critical
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="standard_version">Version</Label>
                    <Input
                      id="standard_version"
                      placeholder="e.g., 2022"
                      value={formData.standard_version}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, standard_version: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="certification_body">Certification Body *</Label>
                    <Input
                      id="certification_body"
                      placeholder="e.g., BSI, TÜV"
                      required
                      value={formData.certification_body}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, certification_body: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate_number">Certificate Number</Label>
                    <Input
                      id="certificate_number"
                      placeholder="Certificate #"
                      value={formData.certificate_number}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, certificate_number: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="valid_from">Valid From *</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      required
                      value={formData.valid_from}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, valid_from: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, valid_until: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Textarea
                    id="scope"
                    placeholder="Certification scope description..."
                    rows={2}
                    value={formData.scope}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate_url">Certificate URL</Label>
                  <Input
                    id="certificate_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.certificate_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, certificate_url: e.target.value }))
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Add Certification
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/30">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No Certifications Recorded</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Add ISO certifications to track this vendor&apos;s compliance status. Critical
              certifications for DORA include ISO 27001, ISO 27017, and SOC 2.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Certification
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => {
              const statusInfo = formatCertificationStatus(cert);
              return (
                <div
                  key={cert.id}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(cert.status)}
                        <span className="font-medium">
                          {cert.standard}
                          {cert.standard_version && `:${cert.standard_version}`}
                        </span>
                        {getRelevanceBadge(cert.standard)}
                        <Badge
                          variant="outline"
                          className={
                            statusInfo.color === 'success'
                              ? 'bg-success/10 text-success border-success/20'
                              : statusInfo.color === 'warning'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : statusInfo.color === 'error'
                              ? 'bg-error/10 text-error border-error/20'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {statusInfo.label}
                        </Badge>
                        {cert.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{cert.certification_body}</span>
                        </div>
                        {cert.valid_from && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(cert.valid_from).toLocaleDateString()}
                              {cert.valid_until &&
                                ` - ${new Date(cert.valid_until).toLocaleDateString()}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {cert.scope && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {cert.scope}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {cert.certificate_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View certificate"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cert.id, cert.standard)}
                        disabled={deletingId === cert.id}
                      >
                        {deletingId === cert.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-error" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
