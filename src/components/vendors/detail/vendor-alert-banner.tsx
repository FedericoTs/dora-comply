'use client';

import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/lib/vendors/types';

interface VendorAlertBannerProps {
  vendor: Vendor;
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

function getAlerts(vendor: Vendor): Alert[] {
  const alerts: Alert[] = [];

  // LEI Status Alerts
  if (vendor.lei_status === 'LAPSED') {
    alerts.push({
      type: 'warning',
      title: 'LEI Lapsed',
      message: 'This vendor\'s LEI has lapsed and needs renewal. Contact the vendor to update their registration.',
    });
  }

  if (vendor.lei_status === 'RETIRED' || vendor.lei_status === 'ANNULLED') {
    alerts.push({
      type: 'error',
      title: 'LEI Invalid',
      message: `This vendor's LEI is ${vendor.lei_status.toLowerCase()}. This may indicate the entity has ceased operations or been merged.`,
    });
  }

  // LEI Renewal Soon
  if (vendor.lei_next_renewal) {
    const renewalDate = new Date(vendor.lei_next_renewal);
    const now = new Date();
    const daysUntilRenewal = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRenewal > 0 && daysUntilRenewal <= 30) {
      alerts.push({
        type: 'warning',
        title: 'LEI Renewal Due',
        message: `LEI renewal required in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}. Notify vendor to renew before ${renewalDate.toLocaleDateString()}.`,
      });
    } else if (daysUntilRenewal <= 0) {
      alerts.push({
        type: 'error',
        title: 'LEI Overdue',
        message: 'LEI renewal is overdue. The vendor should renew immediately to maintain valid identification.',
      });
    }
  }

  // Entity Status
  if (vendor.entity_status && vendor.entity_status !== 'ACTIVE') {
    alerts.push({
      type: 'warning',
      title: 'Entity Not Active',
      message: `Entity status is "${vendor.entity_status}". Verify the vendor's operational status before new contracts.`,
    });
  }

  // Missing Critical Data
  if (!vendor.lei && vendor.supports_critical_function) {
    alerts.push({
      type: 'info',
      title: 'LEI Recommended',
      message: 'This is a critical function provider. Consider requesting an LEI for enhanced due diligence and DORA compliance.',
    });
  }

  // Critical without substitutability assessment
  if (vendor.supports_critical_function && !vendor.substitutability_assessment) {
    alerts.push({
      type: 'info',
      title: 'Assessment Needed',
      message: 'DORA requires substitutability assessment for critical function providers. Complete the vendor assessment.',
    });
  }

  return alerts;
}

const ALERT_STYLES = {
  warning: {
    bg: 'bg-warning/10 border-warning/30',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  error: {
    bg: 'bg-error/10 border-error/30',
    icon: XCircle,
    iconColor: 'text-error',
  },
  info: {
    bg: 'bg-info/10 border-info/30',
    icon: Info,
    iconColor: 'text-info',
  },
};

export function VendorAlertBanner({ vendor }: VendorAlertBannerProps) {
  const alerts = getAlerts(vendor);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const style = ALERT_STYLES[alert.type];
        const Icon = style.icon;

        return (
          <div
            key={idx}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border',
              style.bg
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.iconColor)} />
            <div>
              <p className="font-medium text-sm">{alert.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
