'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MapPin, Copy, Check, ExternalLink, Building2, Briefcase } from 'lucide-react';
import type { GLEIFAddress } from '@/lib/vendors/types';

interface VendorAddressCardProps {
  legalAddress?: GLEIFAddress | null;
  headquartersAddress?: GLEIFAddress | null;
}

// Country flag emoji from ISO 2-letter code
function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Get country name from ISO code
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IE: 'Ireland',
  NL: 'Netherlands',
  LU: 'Luxembourg',
  CH: 'Switzerland',
  IT: 'Italy',
  ES: 'Spain',
  PT: 'Portugal',
  BE: 'Belgium',
  AT: 'Austria',
  SE: 'Sweden',
  DK: 'Denmark',
  NO: 'Norway',
  FI: 'Finland',
  PL: 'Poland',
  CZ: 'Czechia',
  HU: 'Hungary',
  RO: 'Romania',
  BG: 'Bulgaria',
  GR: 'Greece',
  CY: 'Cyprus',
  MT: 'Malta',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  SK: 'Slovakia',
  SI: 'Slovenia',
  HR: 'Croatia',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  AU: 'Australia',
  CA: 'Canada',
  BR: 'Brazil',
  MX: 'Mexico',
  SG: 'Singapore',
  HK: 'Hong Kong',
  KR: 'South Korea',
  TW: 'Taiwan',
};

function getCountryName(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

interface AddressDisplayProps {
  address: GLEIFAddress;
  type: 'legal' | 'headquarters';
}

function AddressDisplay({ address, type }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const flag = getCountryFlag(address.country);
  const countryName = getCountryName(address.country);

  // Format address for display
  const formattedLines: string[] = [];
  if (address.addressLines?.length) {
    formattedLines.push(...address.addressLines.filter(Boolean));
  }
  if (address.city) {
    let cityLine = address.city;
    if (address.region) cityLine += `, ${address.region}`;
    if (address.postalCode) cityLine += ` ${address.postalCode}`;
    formattedLines.push(cityLine);
  } else if (address.postalCode) {
    formattedLines.push(address.postalCode);
  }

  const fullAddress = [...formattedLines, countryName].join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent(fullAddress.replace(/\n/g, ', '));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {type === 'legal' ? (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {type === 'legal' ? 'Legal Address' : 'Headquarters'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xl leading-none">{flag}</span>
          <span className="text-xs text-muted-foreground">{address.country}</span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        {formattedLines.map((line, idx) => (
          <p key={idx} className="text-foreground">
            {line}
          </p>
        ))}
        <p className="text-muted-foreground">{countryName}</p>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 mr-1 text-success" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy address to clipboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleOpenMaps}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Map
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in Google Maps</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function VendorAddressCard({
  legalAddress,
  headquartersAddress,
}: VendorAddressCardProps) {
  const hasLegal = legalAddress && legalAddress.country;
  const hasHQ = headquartersAddress && headquartersAddress.country;

  // Check if addresses are the same
  const sameAddress = hasLegal && hasHQ &&
    JSON.stringify(legalAddress) === JSON.stringify(headquartersAddress);

  if (!hasLegal && !hasHQ) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
            <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No address information available
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
          <MapPin className="h-4 w-4" />
          Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${hasLegal && hasHQ && !sameAddress ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {hasLegal && (
            <AddressDisplay address={legalAddress} type="legal" />
          )}
          {hasHQ && !sameAddress && (
            <AddressDisplay address={headquartersAddress} type="headquarters" />
          )}
        </div>
        {sameAddress && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Legal and headquarters addresses are the same
          </p>
        )}
      </CardContent>
    </Card>
  );
}
