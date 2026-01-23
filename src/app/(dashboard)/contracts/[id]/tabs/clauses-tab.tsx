/**
 * Contract Clauses Tab
 * Displays AI-extracted and manually added contract clauses
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import type { ContractDetail } from '@/lib/contracts/queries';
import type { ContractClause } from '@/lib/contracts/types';
import {
  CLAUSE_TYPE_INFO,
  CLAUSE_RISK_INFO,
} from '@/lib/contracts/types';

interface ContractClausesTabProps {
  contract: ContractDetail;
}

export function ContractClausesTab({ contract }: ContractClausesTabProps) {
  const [selectedClause, setSelectedClause] = useState<ContractClause | null>(null);

  const clauses = contract.clauses || [];

  // Group clauses by type
  const clausesByType = clauses.reduce((acc, clause) => {
    if (!acc[clause.clause_type]) {
      acc[clause.clause_type] = [];
    }
    acc[clause.clause_type].push(clause);
    return acc;
  }, {} as Record<string, ContractClause[]>);

  // Count by risk level
  const riskCounts = clauses.reduce(
    (acc, clause) => {
      if (clause.risk_level) {
        acc[clause.risk_level] = (acc[clause.risk_level] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Count AI extracted
  const aiExtractedCount = clauses.filter((c) => c.ai_extracted).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{clauses.length}</p>
                <p className="text-xs text-muted-foreground">Total Clauses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{aiExtractedCount}</p>
                <p className="text-xs text-muted-foreground">AI Extracted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <div>
                <p className="text-2xl font-semibold">
                  {(riskCounts['critical'] || 0) + (riskCounts['high'] || 0)}
                </p>
                <p className="text-xs text-muted-foreground">High/Critical Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-semibold">
                  {clauses.filter((c) => c.review_status === 'flagged').length}
                </p>
                <p className="text-xs text-muted-foreground">Flagged for Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clauses List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Extracted Clauses</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Clause
          </Button>
        </CardHeader>
        <CardContent>
          {clauses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Clauses Extracted</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a contract document to automatically extract clauses using AI
              </p>
              <Button className="mt-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Clauses with AI
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(clausesByType).map(([type, typeClauses]) => (
                <div key={type}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    {CLAUSE_TYPE_INFO[type as keyof typeof CLAUSE_TYPE_INFO]?.label || type}
                    <Badge variant="secondary" className="text-xs">
                      {typeClauses.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {typeClauses.map((clause) => (
                      <button
                        key={clause.id}
                        onClick={() => setSelectedClause(clause)}
                        className="w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{clause.title}</span>
                              {clause.ai_extracted && (
                                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                              )}
                            </div>
                            {clause.summary && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {clause.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {clause.risk_level && (
                                <Badge
                                  variant="outline"
                                  className={CLAUSE_RISK_INFO[clause.risk_level]?.color || ''}
                                >
                                  {CLAUSE_RISK_INFO[clause.risk_level]?.label}
                                </Badge>
                              )}
                              {clause.dora_relevant && (
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  DORA
                                </Badge>
                              )}
                              {clause.nis2_relevant && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                                  NIS2
                                </Badge>
                              )}
                              {clause.gdpr_relevant && (
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                                  GDPR
                                </Badge>
                              )}
                              {clause.review_status === 'pending' && (
                                <Badge variant="outline" className="bg-muted">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending Review
                                </Badge>
                              )}
                              {clause.review_status === 'flagged' && (
                                <Badge variant="outline" className="bg-warning/10 text-warning">
                                  <Flag className="h-3 w-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                              {clause.review_status === 'approved' && (
                                <Badge variant="outline" className="bg-success/10 text-success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clause Detail Dialog */}
      <Dialog open={!!selectedClause} onOpenChange={() => setSelectedClause(null)}>
        <DialogContent className="max-w-2xl">
          {selectedClause && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedClause.title}
                  {selectedClause.ai_extracted && (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {CLAUSE_TYPE_INFO[selectedClause.clause_type]?.label}
                  </Badge>
                  {selectedClause.risk_level && (
                    <Badge
                      variant="outline"
                      className={CLAUSE_RISK_INFO[selectedClause.risk_level]?.color}
                    >
                      {CLAUSE_RISK_INFO[selectedClause.risk_level]?.label}
                    </Badge>
                  )}
                  {selectedClause.location && (
                    <Badge variant="secondary">{selectedClause.location}</Badge>
                  )}
                </div>

                {/* AI Confidence */}
                {selectedClause.ai_confidence !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">AI Confidence:</span>
                    <span className="font-medium">
                      {Math.round(selectedClause.ai_confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Summary */}
                {selectedClause.summary && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedClause.summary}</p>
                  </div>
                )}

                {/* Full Text */}
                {selectedClause.full_text && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Full Text</h4>
                    <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                      {selectedClause.full_text}
                    </div>
                  </div>
                )}

                {/* Key Terms */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedClause.liability_cap && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Liability Cap</h4>
                      <p className="text-sm">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: selectedClause.liability_cap_currency || 'EUR',
                        }).format(selectedClause.liability_cap)}
                      </p>
                    </div>
                  )}
                  {selectedClause.notice_period_days && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Notice Period</h4>
                      <p className="text-sm">{selectedClause.notice_period_days} days</p>
                    </div>
                  )}
                </div>

                {/* Risk Notes */}
                {selectedClause.risk_notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Risk Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedClause.risk_notes}</p>
                  </div>
                )}

                {/* Review Notes */}
                {selectedClause.review_notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Review Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedClause.review_notes}</p>
                  </div>
                )}

                {/* Compliance Flags */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Compliance Relevance</h4>
                  <div className="flex gap-2">
                    <Badge
                      variant={selectedClause.dora_relevant ? 'default' : 'outline'}
                      className={!selectedClause.dora_relevant ? 'opacity-50' : ''}
                    >
                      DORA
                    </Badge>
                    <Badge
                      variant={selectedClause.nis2_relevant ? 'default' : 'outline'}
                      className={!selectedClause.nis2_relevant ? 'opacity-50' : ''}
                    >
                      NIS2
                    </Badge>
                    <Badge
                      variant={selectedClause.gdpr_relevant ? 'default' : 'outline'}
                      className={!selectedClause.gdpr_relevant ? 'opacity-50' : ''}
                    >
                      GDPR
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedClause(null)}>
                    Close
                  </Button>
                  {selectedClause.review_status !== 'approved' && (
                    <Button>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
