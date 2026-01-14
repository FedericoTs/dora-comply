import { MoreHorizontal } from 'lucide-react';
import { RiskRow } from './risk-row';

interface VendorsByRiskCardProps {
  vendorStats: {
    by_risk: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  totalVendors: number;
}

export function VendorsByRiskCard({ vendorStats, totalVendors }: VendorsByRiskCardProps) {
  return (
    <div className="card-premium p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3>Vendors by Risk</h3>
        <button className="icon-btn">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <RiskRow label="Critical" count={vendorStats.by_risk.critical} total={totalVendors} color="bg-error" />
        <RiskRow label="High" count={vendorStats.by_risk.high} total={totalVendors} color="bg-warning" />
        <RiskRow label="Medium" count={vendorStats.by_risk.medium} total={totalVendors} color="bg-chart-5" />
        <RiskRow label="Low" count={vendorStats.by_risk.low} total={totalVendors} color="bg-success" />
      </div>
    </div>
  );
}
