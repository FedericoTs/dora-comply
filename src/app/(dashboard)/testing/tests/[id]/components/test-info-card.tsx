/**
 * Test Info Card Component
 *
 * Displays detailed information about a test
 */

import Link from 'next/link';
import {
  FlaskConical,
  Calendar,
  User,
  Building2,
  FileText,
  Bug,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getTestTypeLabel,
  getTestStatusLabel,
  getTestResultLabel,
} from '@/lib/testing/types';
import type { TestInfoCardProps } from './types';

export function TestInfoCard({ test }: TestInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {test.name}
            </CardTitle>
            <CardDescription className="font-mono">{test.test_ref}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getTestTypeLabel(test.test_type)}</Badge>
            <Badge
              variant={
                test.status === 'completed'
                  ? 'default'
                  : test.status === 'in_progress'
                  ? 'secondary'
                  : test.status === 'remediation_required'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {getTestStatusLabel(test.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {test.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{test.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Result</p>
            {test.overall_result ? (
              <Badge
                variant={
                  test.overall_result === 'pass'
                    ? 'default'
                    : test.overall_result === 'fail'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {getTestResultLabel(test.overall_result)}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Not assessed</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Planned Start</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {test.planned_start_date
                ? new Date(test.planned_start_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Actual End</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {test.actual_end_date
                ? new Date(test.actual_end_date).toLocaleDateString()
                : 'Not completed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Bug className="h-3.5 w-3.5" />
              {test.findings_count}
              {test.critical_findings_count > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {test.critical_findings_count} critical
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Related entities */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Programme</p>
            {test.programme ? (
              <Link
                href={`/testing/programmes/${test.programme.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                {test.programme.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No programme</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vendor</p>
            {test.vendor ? (
              <Link
                href={`/vendors/${test.vendor.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {test.vendor.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No vendor</span>
            )}
          </div>
        </div>

        {/* Tester information */}
        {(test.tester_name || test.tester_organization || test.tester_certifications?.length) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <User className="h-4 w-4" />
              Tester Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {test.tester_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tester Name</p>
                  <p className="text-sm">{test.tester_name}</p>
                </div>
              )}
              {test.tester_organization && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company</p>
                  <p className="text-sm">{test.tester_organization}</p>
                </div>
              )}
              {test.tester_certifications && test.tester_certifications.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Certifications (Article 27)</p>
                  <div className="flex flex-wrap gap-1">
                    {test.tester_certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scope */}
        {test.scope_description && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Test Scope</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.scope_description}</p>
          </div>
        )}

        {/* Methodology */}
        {test.methodology && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Methodology</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.methodology}</p>
          </div>
        )}

        {/* Executive Summary */}
        {test.executive_summary && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Executive Summary</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.executive_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
