'use client';

import Link from 'next/link';
import { Building2, MapPin, AlertTriangle, CheckCircle2, Clock, MoreVertical, Shield, FileText, ClipboardCheck, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/lib/vendors/types';
import {
  TIER_INFO,
  STATUS_INFO,
  PROVIDER_TYPE_LABELS,
  getRiskLevel,
} from '@/lib/vendors/types';
import { getCountryName, getCountryFlag } from '@/lib/external/gleif';

interface VendorCardProps {
  vendor: Vendor;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onStatusChange?: (vendor: Vendor, status: Vendor['status']) => void;
}

export function VendorCard({ vendor, onEdit, onDelete, onStatusChange }: VendorCardProps) {
  const tierInfo = TIER_INFO[vendor.tier];
  const statusInfo = STATUS_INFO[vendor.status];
  const riskLevel = getRiskLevel(vendor.risk_score);

  const riskColors: Record<string, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-error',
  };

  return (
    <Card className="card-elevated group relative overflow-hidden">
      {/* Tier indicator bar */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-1',
          vendor.tier === 'critical' && 'bg-error',
          vendor.tier === 'important' && 'bg-warning',
          vendor.tier === 'standard' && 'bg-muted-foreground/30'
        )}
      />

      <CardContent className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/vendors/${vendor.id}`}
              className="group/link inline-flex items-center gap-2"
            >
              <h3 className="truncate text-base font-semibold text-foreground group-hover/link:text-primary transition-colors">
                {vendor.name}
              </h3>
            </Link>

            {/* LEI Badge */}
            {vendor.lei && (
              <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                LEI: {vendor.lei}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/vendors/${vendor.id}`}>View Details</Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(vendor)}>
                  Edit Vendor
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onStatusChange && vendor.status !== 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange(vendor, 'active')}>
                  Mark as Active
                </DropdownMenuItem>
              )}
              {onStatusChange && vendor.status !== 'inactive' && (
                <DropdownMenuItem onClick={() => onStatusChange(vendor, 'inactive')}>
                  Mark as Inactive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(vendor)}
                    className="text-error focus:text-error"
                  >
                    Delete Vendor
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta info row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Tier Badge */}
          <Badge
            variant={vendor.tier === 'critical' ? 'destructive' : vendor.tier === 'important' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {tierInfo.label}
          </Badge>

          {/* Status Badge */}
          <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
            {vendor.status === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {vendor.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
            {statusInfo.label}
          </Badge>

          {/* Critical Function Badge */}
          {vendor.supports_critical_function && (
            <Badge variant="outline" className="text-xs border-error/50 text-error">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Critical Function
            </Badge>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {/* Provider Type */}
          {vendor.provider_type && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {PROVIDER_TYPE_LABELS[vendor.provider_type]}
              </span>
            </div>
          )}

          {/* Location */}
          {vendor.headquarters_country && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {getCountryFlag(vendor.headquarters_country)}{' '}
                {getCountryName(vendor.headquarters_country)}
              </span>
            </div>
          )}

          {/* Risk Score */}
          {vendor.risk_score !== null && riskLevel && (
            <div className="flex items-center gap-2">
              <Shield className={cn('h-4 w-4 shrink-0', riskColors[riskLevel])} />
              <span className={cn('font-medium', riskColors[riskLevel])}>
                Risk: {vendor.risk_score}
              </span>
            </div>
          )}
        </div>

        {/* Service Types */}
        {vendor.service_types.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {vendor.service_types.slice(0, 3).map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
            {vendor.service_types.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{vendor.service_types.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Quick Actions - visible on hover */}
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            asChild
          >
            <Link href={`/vendors/${vendor.id}`}>
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              Assess
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            asChild
          >
            <Link href={`/documents?vendor=${vendor.id}`}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Docs
            </Link>
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => onEdit(vendor)}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
