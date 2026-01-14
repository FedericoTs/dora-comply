'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
  ConcentrationAlert,
  ConcentrationThresholds,
  ConcentrationMetrics,
  VendorRecord,
} from './types';

interface UseConcentrationDataReturn {
  alerts: ConcentrationAlert[];
  metrics: ConcentrationMetrics | null;
  thresholds: ConcentrationThresholds;
  loading: boolean;
  saving: boolean;
  saveThresholds: (newThresholds: ConcentrationThresholds) => Promise<void>;
  refetch: () => void;
}

export function useConcentrationData(): UseConcentrationDataReturn {
  const [alerts, setAlerts] = useState<ConcentrationAlert[]>([]);
  const [metrics, setMetrics] = useState<ConcentrationMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ConcentrationThresholds>({
    critical: 40,
    warning: 25,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get organization thresholds
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      const { data: orgData } = await supabase
        .from('organizations')
        .select('concentration_threshold_critical, concentration_threshold_warning')
        .eq('id', userData.organization_id)
        .single();

      const currentThresholds = orgData ? {
        critical: orgData.concentration_threshold_critical || 40,
        warning: orgData.concentration_threshold_warning || 25,
      } : { critical: 40, warning: 25 };

      setThresholds(currentThresholds);

      // Get vendors for concentration analysis
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, name, headquarters_country, service_types, tier, supports_critical_function')
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null);

      const vendors = (vendorsData || []) as VendorRecord[];

      if (vendors.length === 0) {
        setMetrics(null);
        setAlerts([]);
        setLoading(false);
        return;
      }

      // Calculate concentration metrics
      const totalVendors = vendors.length;
      const criticalVendors = vendors.filter(v => v.tier === 'critical' || v.supports_critical_function);

      // Vendor concentration (critical vendors as % of total)
      const vendorConcentration = (criticalVendors.length / totalVendors) * 100;

      // Geographic concentration
      const countryCount: Record<string, number> = {};
      vendors.forEach(v => {
        const country = v.headquarters_country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });
      const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0];
      const geographicConcentration = topCountry ? (topCountry[1] / totalVendors) * 100 : 0;

      // Service concentration
      const serviceCount: Record<string, number> = {};
      vendors.forEach(v => {
        (v.service_types || []).forEach((s: string) => {
          serviceCount[s] = (serviceCount[s] || 0) + 1;
        });
      });
      const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];
      const serviceConcentration = topService ? (topService[1] / totalVendors) * 100 : 0;

      // Build metrics
      const calculatedMetrics: ConcentrationMetrics = {
        vendorConcentration,
        geographicConcentration,
        serviceConcentration,
        topVendors: criticalVendors.slice(0, 5).map(v => ({
          name: v.name,
          percentage: (1 / criticalVendors.length) * 100,
        })),
        topCountries: Object.entries(countryCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country, count]) => ({
            country,
            percentage: (count / totalVendors) * 100,
          })),
        topServices: Object.entries(serviceCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([service, count]) => ({
            service,
            percentage: (count / totalVendors) * 100,
          })),
      };

      setMetrics(calculatedMetrics);

      // Generate alerts based on thresholds
      const newAlerts: ConcentrationAlert[] = [];

      // Vendor concentration alert
      if (vendorConcentration >= currentThresholds.critical) {
        newAlerts.push({
          id: 'vendor-critical',
          type: 'vendor',
          severity: 'critical',
          title: 'Critical Vendor Concentration',
          description: `${criticalVendors.length} of ${totalVendors} vendors are marked as critical or support critical functions`,
          percentage: vendorConcentration,
          threshold: currentThresholds.critical,
          affectedItems: criticalVendors.map(v => v.name),
          createdAt: new Date().toISOString(),
        });
      } else if (vendorConcentration >= currentThresholds.warning) {
        newAlerts.push({
          id: 'vendor-warning',
          type: 'vendor',
          severity: 'warning',
          title: 'Vendor Concentration Warning',
          description: `${criticalVendors.length} of ${totalVendors} vendors are marked as critical or support critical functions`,
          percentage: vendorConcentration,
          threshold: currentThresholds.warning,
          affectedItems: criticalVendors.map(v => v.name),
          createdAt: new Date().toISOString(),
        });
      }

      // Geographic concentration alert
      if (geographicConcentration >= currentThresholds.critical) {
        newAlerts.push({
          id: 'geo-critical',
          type: 'geographic',
          severity: 'critical',
          title: 'Critical Geographic Concentration',
          description: `${topCountry[1]} of ${totalVendors} vendors are headquartered in ${topCountry[0]}`,
          percentage: geographicConcentration,
          threshold: currentThresholds.critical,
          affectedItems: [topCountry[0]],
          createdAt: new Date().toISOString(),
        });
      } else if (geographicConcentration >= currentThresholds.warning) {
        newAlerts.push({
          id: 'geo-warning',
          type: 'geographic',
          severity: 'warning',
          title: 'Geographic Concentration Warning',
          description: `${topCountry[1]} of ${totalVendors} vendors are headquartered in ${topCountry[0]}`,
          percentage: geographicConcentration,
          threshold: currentThresholds.warning,
          affectedItems: [topCountry[0]],
          createdAt: new Date().toISOString(),
        });
      }

      // Service concentration alert
      if (serviceConcentration >= currentThresholds.critical && topService) {
        newAlerts.push({
          id: 'service-critical',
          type: 'service',
          severity: 'critical',
          title: 'Critical Service Concentration',
          description: `${topService[1]} vendors provide "${topService[0]}" services`,
          percentage: serviceConcentration,
          threshold: currentThresholds.critical,
          affectedItems: [topService[0]],
          createdAt: new Date().toISOString(),
        });
      } else if (serviceConcentration >= currentThresholds.warning && topService) {
        newAlerts.push({
          id: 'service-warning',
          type: 'service',
          severity: 'warning',
          title: 'Service Concentration Warning',
          description: `${topService[1]} vendors provide "${topService[0]}" services`,
          percentage: serviceConcentration,
          threshold: currentThresholds.warning,
          affectedItems: [topService[0]],
          createdAt: new Date().toISOString(),
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching concentration data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveThresholds = async (newThresholds: ConcentrationThresholds) => {
    setSaving(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('No organization');

      const { error } = await supabase
        .from('organizations')
        .update({
          concentration_threshold_critical: newThresholds.critical,
          concentration_threshold_warning: newThresholds.warning,
        })
        .eq('id', userData.organization_id);

      if (error) throw error;

      setThresholds(newThresholds);
      toast.success('Thresholds updated');

      // Refresh data to recalculate alerts
      fetchData();
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save thresholds');
    } finally {
      setSaving(false);
    }
  };

  return {
    alerts,
    metrics,
    thresholds,
    loading,
    saving,
    saveThresholds,
    refetch: fetchData,
  };
}
