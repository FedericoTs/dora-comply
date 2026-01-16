'use client';

import { useState, useMemo } from 'react';
import type { NIS2Risk, RiskSummary } from '@/lib/nis2/types';
import { RiskRegisterHeader } from './risk-register-header';
import { RiskRegisterFilters, type RiskFilters } from './risk-register-filters';
import { RiskRegisterTable, type RiskSortOptions } from './risk-register-table';

interface RiskRegisterClientProps {
  initialRisks: NIS2Risk[];
  summary: RiskSummary | null;
  totalCount: number;
}

export function RiskRegisterClient({
  initialRisks,
  summary,
  totalCount,
}: RiskRegisterClientProps) {
  const [filters, setFilters] = useState<RiskFilters>({});
  const [sortOptions, setSortOptions] = useState<RiskSortOptions>({
    field: 'inherent_risk_score',
    direction: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Apply client-side filtering
  const filteredRisks = useMemo(() => {
    let result = [...initialRisks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.reference_code.toLowerCase().includes(searchLower) ||
          r.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((r) => r.category === filters.category);
    }

    // Status filter
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }

    // Risk level filter (applies to residual if available, otherwise inherent)
    if (filters.risk_level) {
      result = result.filter((r) => {
        const level = r.residual_risk_level ?? r.inherent_risk_level;
        return level === filters.risk_level;
      });
    }

    // Treatment strategy filter
    if (filters.treatment_strategy) {
      result = result.filter((r) => r.treatment_strategy === filters.treatment_strategy);
    }

    return result;
  }, [initialRisks, filters]);

  // Apply client-side sorting
  const sortedRisks = useMemo(() => {
    const result = [...filteredRisks];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'reference_code':
          comparison = a.reference_code.localeCompare(b.reference_code);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'inherent_risk_score':
          comparison = a.inherent_risk_score - b.inherent_risk_score;
          break;
        case 'residual_risk_score':
          const aResidual = a.residual_risk_score ?? a.inherent_risk_score;
          const bResidual = b.residual_risk_score ?? b.inherent_risk_score;
          comparison = aResidual - bResidual;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredRisks, sortOptions]);

  return (
    <div className="space-y-6">
      <RiskRegisterHeader summary={summary} />

      <RiskRegisterFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalCount}
        filteredCount={filteredRisks.length}
      />

      <RiskRegisterTable
        risks={sortedRisks}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortOptions={sortOptions}
        onSort={setSortOptions}
      />
    </div>
  );
}
