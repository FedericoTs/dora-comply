/**
 * Concentration Risk Types
 */

export interface ConcentrationAlert {
  id: string;
  type: 'vendor' | 'geographic' | 'service';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  percentage: number;
  threshold: number;
  affectedItems: string[];
  createdAt: string;
}

export interface ConcentrationThresholds {
  critical: number;
  warning: number;
}

export interface ConcentrationMetrics {
  vendorConcentration: number;
  geographicConcentration: number;
  serviceConcentration: number;
  topVendors: Array<{ name: string; percentage: number }>;
  topCountries: Array<{ country: string; percentage: number }>;
  topServices: Array<{ service: string; percentage: number }>;
}

export interface VendorRecord {
  id: string;
  name: string;
  headquarters_country: string | null;
  service_types: string[] | null;
  tier: string | null;
  supports_critical_function: boolean | null;
}

export type ConcentrationSeverity = 'critical' | 'warning' | 'ok';
