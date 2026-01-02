'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { VendorLEIStatus } from './vendor-lei-status';
import { VendorRiskGauge } from './vendor-risk-gauge';
import type { Vendor } from '@/lib/vendors/types';
import { getRiskLevel } from '@/lib/vendors/types';

interface VendorHeroProps {
  vendor: Vendor;
  onRefreshGleif?: () => void;
  isRefreshing?: boolean;
}

export function VendorHero({ vendor, onRefreshGleif, isRefreshing }: VendorHeroProps) {
  const isCritical = vendor.supports_critical_function;
  const riskLevel = getRiskLevel(vendor.risk_score ?? null);

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/vendors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/vendors/${vendor.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRefreshGleif} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh GLEIF Data
              </DropdownMenuItem>
              {vendor.lei && (
                <DropdownMenuItem asChild>
                  <a
                    href={`https://search.gleif.org/#/record/${vendor.lei}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GLEIF
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="card-premium p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Vendor Info */}
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {vendor.name}
                </h1>
                {isCritical && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Shield className="h-3 w-3" />
                    Critical Function
                  </Badge>
                )}
              </div>
            </div>

            {/* LEI Status */}
            <div className="flex items-center gap-2 flex-wrap">
              {vendor.lei && (
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  LEI: {vendor.lei}
                </code>
              )}
              <VendorLEIStatus
                lei={vendor.lei}
                leiStatus={vendor.lei_status}
                leiVerifiedAt={vendor.lei_verified_at}
                leiNextRenewal={vendor.lei_next_renewal}
                entityStatus={vendor.entity_status}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Provider Type:</span>{' '}
                <span className="font-medium">{vendor.provider_type || 'Not specified'}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Jurisdiction:</span>{' '}
                <span className="font-medium">{vendor.jurisdiction || 'Not specified'}</span>
              </div>
              {vendor.esa_register_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">ESA ID:</span>{' '}
                  <span className="font-medium">{vendor.esa_register_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Risk Gauge */}
          <div className="flex-shrink-0">
            <VendorRiskGauge
              score={vendor.risk_score ?? null}
              level={riskLevel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
