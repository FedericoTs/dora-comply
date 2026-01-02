'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileText, HelpCircle, Euro, Calendar, Building, Scale } from 'lucide-react';
import type { Vendor, SubstitutabilityAssessment } from '@/lib/vendors/types';

interface VendorESAFieldsProps {
  vendor: Vendor;
}

const SUBSTITUTABILITY_CONFIG: Record<SubstitutabilityAssessment, {
  label: string;
  color: string;
  description: string;
}> = {
  easily_substitutable: {
    label: 'Easily Substitutable',
    color: 'bg-success/10 text-success border-success/20',
    description: 'Can be replaced with minimal impact',
  },
  substitutable_with_difficulty: {
    label: 'Difficult',
    color: 'bg-warning/10 text-warning border-warning/20',
    description: 'Replacement possible but challenging',
  },
  not_substitutable: {
    label: 'Not Substitutable',
    color: 'bg-error/10 text-error border-error/20',
    description: 'Critical dependency, no alternatives',
  },
  not_assessed: {
    label: 'Not Assessed',
    color: 'bg-muted text-muted-foreground border-muted',
    description: 'Assessment pending',
  },
};

interface FieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tooltip?: string;
}

function Field({ label, value, icon: Icon, tooltip }: FieldProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}

function formatCurrency(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return '—';
  const currencyCode = currency || 'EUR';
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function VendorESAFields({ vendor }: VendorESAFieldsProps) {
  const substitutability = vendor.substitutability_assessment;
  const subConfig = substitutability ? SUBSTITUTABILITY_CONFIG[substitutability] : null;

  const hasAnyData = vendor.substitutability_assessment ||
    vendor.total_annual_expense ||
    vendor.esa_register_id ||
    vendor.legal_form_code ||
    vendor.registration_authority_id ||
    vendor.registration_number ||
    vendor.entity_creation_date;

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ESA Compliance Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
            <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No ESA compliance data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete the vendor assessment to populate these fields
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          ESA Compliance Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Substitutability */}
          <Field
            label="Substitutability"
            icon={Scale}
            tooltip="DORA requires assessment of how easily this provider can be replaced"
            value={
              subConfig ? (
                <Badge variant="outline" className={subConfig.color}>
                  {subConfig.label}
                </Badge>
              ) : (
                <span className="text-muted-foreground">Not assessed</span>
              )
            }
          />

          {/* Annual Expense */}
          <Field
            label="Annual Expense"
            icon={Euro}
            tooltip="Total yearly spending with this ICT provider"
            value={formatCurrency(vendor.total_annual_expense, vendor.expense_currency)}
          />

          {/* Currency */}
          {vendor.expense_currency && (
            <Field
              label="Currency"
              value={vendor.expense_currency}
            />
          )}

          {/* ESA Register ID */}
          {vendor.esa_register_id && (
            <Field
              label="ESA Register ID"
              icon={FileText}
              tooltip="Identifier in ESA's Register of Information"
              value={
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {vendor.esa_register_id}
                </code>
              }
            />
          )}

          {/* Legal Form */}
          {vendor.legal_form_code && (
            <Field
              label="Legal Form"
              icon={Building}
              tooltip="Corporate legal structure (e.g., GmbH, PLC, Ltd)"
              value={vendor.legal_form_code}
            />
          )}

          {/* Registration Authority */}
          {vendor.registration_authority_id && (
            <Field
              label="Registration Authority"
              tooltip="The authority where the entity is registered"
              value={
                <span className="text-xs font-mono">
                  {vendor.registration_authority_id}
                </span>
              }
            />
          )}

          {/* Registration Number */}
          {vendor.registration_number && (
            <Field
              label="Registration No."
              tooltip="Company registration number"
              value={vendor.registration_number}
            />
          )}

          {/* Entity Creation Date */}
          {vendor.entity_creation_date && (
            <Field
              label="Incorporated"
              icon={Calendar}
              tooltip="Date the legal entity was established"
              value={formatDate(vendor.entity_creation_date)}
            />
          )}
        </div>

        {/* Regulatory Authorizations */}
        {vendor.regulatory_authorizations && vendor.regulatory_authorizations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Regulatory Authorizations
            </p>
            <div className="flex flex-wrap gap-2">
              {vendor.regulatory_authorizations.map((auth, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {auth}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
