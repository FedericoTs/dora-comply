'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  LayoutDashboard,
  Shield,
  Users,
  Activity,
  FileText,
  ScrollText,
  Gauge,
  Sparkles,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type VendorNavSection =
  | 'summary'
  | 'dora'
  | 'nis2'
  | 'frameworks'
  | 'contacts'
  | 'contracts'
  | 'documents'
  | 'monitoring'
  | 'ai-analysis'
  | 'risk-trends'
  | 'enrichment'
  | 'ctpp';

interface NavItem {
  id: VendorNavSection;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface VendorNavigationBarProps {
  activeSection: VendorNavSection;
  onSectionChange: (section: VendorNavSection) => void;
  showCTTPTab?: boolean;
  hasAIAnalysis?: boolean;
}

const complianceItems: NavItem[] = [
  { id: 'nis2', label: 'NIS2', icon: Shield },
  { id: 'dora', label: 'DORA', icon: Shield },
  { id: 'frameworks', label: 'Frameworks', icon: Gauge },
];

const relationshipItems: NavItem[] = [
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const intelligenceItems: NavItem[] = [
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'ai-analysis', label: 'AI Analysis', icon: Sparkles },
  { id: 'risk-trends', label: 'Risk Trends', icon: TrendingUp },
];

export function VendorNavigationBar({
  activeSection,
  onSectionChange,
  showCTTPTab = false,
  hasAIAnalysis = true,
}: VendorNavigationBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Determine which group the active section belongs to
  const getActiveGroup = (section: VendorNavSection): string | null => {
    if (complianceItems.some(item => item.id === section)) return 'compliance';
    if (relationshipItems.some(item => item.id === section)) return 'relationships';
    if (intelligenceItems.some(item => item.id === section)) return 'intelligence';
    return null;
  };

  const activeGroup = getActiveGroup(activeSection);

  // Get label for active item in a group
  const getActiveLabel = (items: NavItem[], defaultLabel: string): string => {
    const activeItem = items.find(item => item.id === activeSection);
    return activeItem ? activeItem.label : defaultLabel;
  };

  const renderDropdownGroup = (
    groupId: string,
    label: string,
    Icon: React.ElementType,
    items: NavItem[]
  ) => {
    const isActive = activeGroup === groupId;
    const displayLabel = isActive ? getActiveLabel(items, label) : label;

    return (
      <DropdownMenu
        open={openDropdown === groupId}
        onOpenChange={(open) => setOpenDropdown(open ? groupId : null)}
      >
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{displayLabel}</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isItemActive = activeSection === item.id;
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setOpenDropdown(null);
                }}
                className={cn(isItemActive && 'bg-accent')}
              >
                <ItemIcon className="h-4 w-4 mr-2" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Filter intelligence items based on feature flags
  const filteredIntelligenceItems = intelligenceItems.filter(item => {
    if (item.id === 'ai-analysis' && !hasAIAnalysis) return false;
    return true;
  });

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-10">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {/* Summary - always visible */}
        <button
          onClick={() => onSectionChange('summary')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            activeSection === 'summary'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Summary
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Compliance Dropdown */}
        {renderDropdownGroup('compliance', 'Compliance', Shield, complianceItems)}

        {/* Relationships Dropdown */}
        {renderDropdownGroup('relationships', 'Relationships', Users, relationshipItems)}

        {/* Intelligence Dropdown */}
        {renderDropdownGroup('intelligence', 'Intelligence', Activity, filteredIntelligenceItems)}

        {/* Enrichment - standalone */}
        <button
          onClick={() => onSectionChange('enrichment')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            activeSection === 'enrichment'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Building2 className="h-4 w-4" />
          Enrichment
        </button>

        {/* CTPP - conditional */}
        {showCTTPTab && (
          <button
            onClick={() => onSectionChange('ctpp')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              activeSection === 'ctpp'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Shield className="h-4 w-4" />
            CTPP Oversight
          </button>
        )}
      </div>
    </div>
  );
}
