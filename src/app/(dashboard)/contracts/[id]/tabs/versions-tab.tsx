/**
 * Contract Versions Tab
 * Displays contract version history and amendments
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Plus,
  GitBranch,
} from 'lucide-react';
import type { ContractDetail } from '@/lib/contracts/queries';
import type { ContractVersion } from '@/lib/contracts/types';
import { VERSION_TYPE_INFO } from '@/lib/contracts/types';

interface ContractVersionsTabProps {
  contract: ContractDetail;
}

export function ContractVersionsTab({ contract }: ContractVersionsTabProps) {
  const versions = contract.versions || [];

  // Sort by version number descending
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-6">
      {/* Header with Add Version */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Version History</h3>
          <p className="text-sm text-muted-foreground">
            Track amendments, addendums, and changes to this contract
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Version
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Version History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add version records to track contract amendments
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Original Version
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {sortedVersions.map((version, index) => (
                  <div key={version.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        index === 0
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-muted-foreground'
                      }`}
                    >
                      {version.version_type === 'original' ? (
                        <FileText className="h-3 w-3" />
                      ) : (
                        <GitBranch className="h-3 w-3" />
                      )}
                    </div>

                    {/* Version Card */}
                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Version {version.version_number}</span>
                            <Badge variant="outline">
                              {VERSION_TYPE_INFO[version.version_type]?.label}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="default" className="bg-primary">
                                Current
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Effective: {new Date(version.effective_date).toLocaleDateString()}
                            </span>
                            {version.supersedes_version && (
                              <span>Supersedes v{version.supersedes_version}</span>
                            )}
                          </div>

                          {version.change_summary && (
                            <p className="text-sm text-muted-foreground">
                              {version.change_summary}
                            </p>
                          )}

                          {version.created_by && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              Created {new Date(version.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {version.document_id && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/documents/${version.document_id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Document
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Summary */}
      {sortedVersions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Versions</p>
                <p className="text-2xl font-semibold">{versions.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amendments</p>
                <p className="text-2xl font-semibold">
                  {versions.filter((v) => v.version_type === 'amendment').length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Addendums</p>
                <p className="text-2xl font-semibold">
                  {versions.filter((v) => v.version_type === 'addendum').length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Version</p>
                <p className="text-2xl font-semibold">
                  v{sortedVersions[0]?.version_number || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
