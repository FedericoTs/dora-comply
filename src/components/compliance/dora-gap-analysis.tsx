'use client';

/**
 * DORA Gap Analysis Component
 *
 * Displays detailed gap analysis with:
 * - Article-level coverage status
 * - Evidence from SOC 2 controls
 * - Remediation recommendations
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// DORA Article Requirements with full details
// Complete coverage of all major DORA articles relevant for financial entities
export const DORA_ARTICLES = {
  // Chapter II: ICT Risk Management (Articles 5-16)
  'Art.5': {
    title: 'ICT Risk Management Framework',
    pillar: 'ICT_RISK',
    description: 'Establish and maintain a sound, comprehensive and well-documented ICT risk management framework as part of the overall risk management system.',
    requirements: [
      'Define ICT risk management strategy approved by management body',
      'Identify ICT-supported business functions and critical assets',
      'Map ICT assets, dependencies and interconnections',
      'Establish risk tolerance levels aligned with business strategy',
      'Assign clear roles and responsibilities for ICT risk',
    ],
    remediation: [
      'Create documented ICT risk management policy with board approval',
      'Implement comprehensive asset inventory with criticality classification',
      'Define risk appetite statements specifically for ICT risks',
      'Establish ICT risk committee or governance structure',
      'Document RACI matrix for ICT risk responsibilities',
    ],
  },
  'Art.6': {
    title: 'ICT Systems, Protocols and Tools',
    pillar: 'ICT_RISK',
    description: 'Use and maintain updated ICT systems, protocols and tools that are appropriate, reliable and have sufficient capacity.',
    requirements: [
      'Maintain up-to-date and patched ICT systems',
      'Use secure and industry-standard protocols',
      'Implement appropriate security tools and solutions',
      'Ensure adequate system capacity and performance',
      'Regular assessment of technology obsolescence',
    ],
    remediation: [
      'Implement automated patch management program',
      'Deploy comprehensive security monitoring tools (EDR, SIEM)',
      'Document system architecture and communication protocols',
      'Establish capacity planning and monitoring processes',
      'Create technology lifecycle management procedures',
    ],
  },
  'Art.7': {
    title: 'Identification',
    pillar: 'ICT_RISK',
    description: 'Identify, classify and adequately document all ICT-supported business functions, information assets and ICT assets.',
    requirements: [
      'Maintain complete ICT asset inventory',
      'Classify assets by criticality and sensitivity',
      'Document all information assets and data flows',
      'Map interdependencies between systems and services',
      'Identify sources of ICT risk',
    ],
    remediation: [
      'Deploy asset discovery and inventory management tools',
      'Implement data classification scheme (public, internal, confidential, restricted)',
      'Create data flow diagrams for critical processes',
      'Document system dependency maps',
      'Conduct regular ICT risk assessments',
    ],
  },
  'Art.8': {
    title: 'Protection and Prevention',
    pillar: 'ICT_RISK',
    description: 'Develop and implement ICT security policies, procedures, protocols and tools to ensure resilience, continuity and availability.',
    requirements: [
      'Comprehensive information security policy',
      'Identity and access management controls',
      'Strong authentication mechanisms (MFA)',
      'Encryption for data at rest and in transit',
      'Network security and segmentation',
      'Vulnerability management program',
    ],
    remediation: [
      'Develop and maintain security policies aligned with ISO 27001/NIST',
      'Implement centralized IAM with role-based access control',
      'Deploy MFA for all privileged and remote access',
      'Enable TLS 1.3 and AES-256 encryption standards',
      'Implement network segmentation and zero-trust architecture',
      'Establish vulnerability scanning and remediation SLAs',
    ],
  },
  'Art.9': {
    title: 'Detection',
    pillar: 'ICT_RISK',
    description: 'Establish mechanisms to promptly detect anomalous activities and single points of failure.',
    requirements: [
      'Continuous security monitoring capabilities',
      'Anomaly and threat detection mechanisms',
      'Comprehensive logging and log analysis',
      'Intrusion detection/prevention systems',
      'User behavior analytics',
    ],
    remediation: [
      'Deploy SIEM with 24/7 monitoring capabilities',
      'Implement EDR/XDR solutions across endpoints',
      'Enable comprehensive audit logging with retention policies',
      'Deploy IDS/IPS at network perimeters',
      'Implement UEBA for insider threat detection',
    ],
  },
  'Art.10': {
    title: 'Response and Recovery',
    pillar: 'ICT_RISK',
    description: 'Put in place a comprehensive ICT business continuity policy including response and recovery plans.',
    requirements: [
      'ICT business continuity policy',
      'Incident response procedures and playbooks',
      'Defined RTO and RPO for critical systems',
      'Backup and restoration capabilities',
      'Crisis communication procedures',
    ],
    remediation: [
      'Develop ICT continuity policy aligned with BIA results',
      'Create detailed incident response playbooks by scenario',
      'Define and document RTO/RPO targets per system tier',
      'Implement 3-2-1 backup strategy with regular testing',
      'Establish crisis communication plans and contact lists',
    ],
  },
  'Art.11': {
    title: 'Backup Policies and Recovery',
    pillar: 'ICT_RISK',
    description: 'Establish backup policies and procedures, and recovery and restoration methods.',
    requirements: [
      'Documented backup policy and procedures',
      'Regular backup testing and validation',
      'Secure and redundant backup storage',
      'Recovery point and time objectives met',
      'Backup encryption and access controls',
    ],
    remediation: [
      'Implement automated backup solutions with monitoring',
      'Schedule quarterly backup restoration tests',
      'Deploy geographically separated backup storage',
      'Document and test recovery procedures quarterly',
      'Enable backup encryption with key management',
    ],
  },
  'Art.12': {
    title: 'Learning and Evolving',
    pillar: 'ICT_RISK',
    description: 'Gather information on vulnerabilities, cyber threats and incidents to learn and improve ICT risk management.',
    requirements: [
      'Post-incident review processes',
      'Lessons learned documentation',
      'Threat intelligence integration',
      'Continuous improvement of controls',
      'Training based on incident learnings',
    ],
    remediation: [
      'Implement formal post-incident review process',
      'Create lessons learned repository and knowledge base',
      'Subscribe to threat intelligence feeds (FS-ISAC)',
      'Establish control improvement tracking',
      'Incorporate incident learnings into security training',
    ],
  },
  'Art.13': {
    title: 'Communication',
    pillar: 'ICT_RISK',
    description: 'Establish communication plans for responsible disclosure and internal/external communication during incidents.',
    requirements: [
      'Internal communication procedures',
      'External stakeholder communication plans',
      'Responsible disclosure policy',
      'Regulatory notification procedures',
      'Media and public communication guidelines',
    ],
    remediation: [
      'Define internal escalation and communication chains',
      'Create stakeholder communication templates',
      'Publish responsible disclosure/bug bounty program',
      'Document regulatory notification procedures by jurisdiction',
      'Establish media response protocols',
    ],
  },
  // Chapter III: ICT-related Incident Management (Articles 17-23)
  'Art.17': {
    title: 'ICT-related Incident Management Process',
    pillar: 'INCIDENT',
    description: 'Define, establish and implement an ICT-related incident management process to detect, manage and notify incidents.',
    requirements: [
      'Formal incident management process',
      'Incident detection and triage procedures',
      'Incident classification and prioritization scheme',
      'Root cause analysis methodology',
      'Incident metrics and KPIs',
    ],
    remediation: [
      'Implement ITIL-aligned incident management framework',
      'Deploy incident ticketing system with SLA tracking',
      'Create incident classification matrix (P1-P4)',
      'Adopt 5-Whys or fishbone analysis for RCA',
      'Define and track MTTD, MTTR, and incident volume metrics',
    ],
  },
  'Art.18': {
    title: 'Classification of ICT-related Incidents',
    pillar: 'INCIDENT',
    description: 'Classify ICT-related incidents based on criteria including clients affected, duration, geographical spread and data losses.',
    requirements: [
      'Incident classification criteria',
      'Major incident threshold definitions',
      'Impact assessment methodology',
      'Classification review process',
      'Escalation triggers by classification',
    ],
    remediation: [
      'Define classification criteria per DORA RTS requirements',
      'Document major incident thresholds (clients, duration, data)',
      'Create impact assessment templates',
      'Establish classification review during incidents',
      'Map classification levels to escalation procedures',
    ],
  },
  'Art.19': {
    title: 'Reporting of Major ICT-related Incidents',
    pillar: 'INCIDENT',
    description: 'Report major ICT-related incidents to the relevant competent authority using prescribed templates and timelines.',
    requirements: [
      'Initial notification within 4 hours',
      'Intermediate report within 72 hours',
      'Final report within 1 month',
      'Standardized reporting templates',
      'Regulatory communication channels',
    ],
    remediation: [
      'Implement incident reporting workflow with timeline tracking',
      'Pre-populate regulatory report templates',
      'Establish direct communication channels with regulators',
      'Train incident team on reporting requirements',
      'Conduct reporting drills quarterly',
    ],
  },
  'Art.20': {
    title: 'Harmonisation of Reporting Content',
    pillar: 'INCIDENT',
    description: 'Use standardized templates and formats for incident reporting to enable aggregation and analysis.',
    requirements: [
      'Standardized incident data fields',
      'Consistent taxonomy and definitions',
      'Machine-readable reporting formats',
      'Cross-border reporting alignment',
    ],
    remediation: [
      'Adopt ESA incident reporting templates',
      'Implement incident data standards in ticketing system',
      'Enable automated report generation',
      'Align reporting with EU regulatory requirements',
    ],
  },
  // Chapter IV: Digital Operational Resilience Testing (Articles 24-27)
  'Art.24': {
    title: 'General Requirements for Testing',
    pillar: 'RESILIENCE',
    description: 'Establish, maintain and review a sound and comprehensive digital operational resilience testing programme.',
    requirements: [
      'Documented testing programme',
      'Risk-based testing approach',
      'Annual testing schedule at minimum',
      'Testing of critical systems and processes',
      'Independent testing where appropriate',
    ],
    remediation: [
      'Develop comprehensive resilience testing programme',
      'Define testing scope based on risk assessment',
      'Create annual testing calendar with owners',
      'Ensure coverage of all critical functions',
      'Engage independent testers for high-risk areas',
    ],
  },
  'Art.25': {
    title: 'Testing of ICT Tools and Systems',
    pillar: 'RESILIENCE',
    description: 'Perform appropriate tests including vulnerability assessments, network security, gap analyses and penetration testing.',
    requirements: [
      'Regular vulnerability assessments',
      'Penetration testing programme',
      'Network security assessments',
      'Source code reviews where applicable',
      'Scenario-based testing',
    ],
    remediation: [
      'Implement continuous vulnerability scanning',
      'Conduct annual penetration tests by certified testers',
      'Perform quarterly network security assessments',
      'Integrate SAST/DAST in development pipeline',
      'Execute tabletop exercises for critical scenarios',
    ],
  },
  'Art.26': {
    title: 'Advanced Testing (TLPT)',
    pillar: 'RESILIENCE',
    description: 'Significant financial entities shall carry out threat-led penetration testing (TLPT) at least every 3 years.',
    requirements: [
      'TLPT programme for significant entities',
      'Testing based on real threat intelligence',
      'Red team/blue team exercises',
      'Coverage of critical functions',
      'Regulatory notification of TLPT',
    ],
    remediation: [
      'Establish TLPT programme aligned with TIBER-EU',
      'Engage threat intelligence providers',
      'Plan red team exercises with defined scope',
      'Ensure TLPT covers all critical ICT systems',
      'Coordinate TLPT scheduling with competent authority',
    ],
  },
  // Chapter V: ICT Third-Party Risk Management (Articles 28-44)
  'Art.28': {
    title: 'General Principles for TPRM',
    pillar: 'TPRM',
    description: 'Manage ICT third-party risk as an integral part of ICT risk within the overall risk management framework.',
    requirements: [
      'TPRM strategy and policy',
      'Register of Information (RoI) on ICT third-party providers',
      'Due diligence procedures for ICT providers',
      'Ongoing monitoring of ICT third parties',
      'Concentration risk assessment',
    ],
    remediation: [
      'Develop TPRM policy approved by management body',
      'Implement and maintain Register of Information (xBRL-CSV)',
      'Create vendor assessment questionnaire and scoring',
      'Deploy vendor risk monitoring platform',
      'Conduct annual concentration risk analysis',
    ],
  },
  'Art.29': {
    title: 'Preliminary Assessment of ICT Concentration Risk',
    pillar: 'TPRM',
    description: 'Before entering into contractual arrangements, assess ICT concentration risks at entity and group level.',
    requirements: [
      'Pre-contract concentration assessment',
      'Group-level aggregation of dependencies',
      'Substitutability analysis',
      'Impact of provider failure assessment',
      'Exit strategy requirements',
    ],
    remediation: [
      'Implement concentration risk assessment in procurement',
      'Maintain group-wide vendor dependency mapping',
      'Assess alternative providers for critical services',
      'Model scenarios of critical provider failure',
      'Document exit strategies before contract signing',
    ],
  },
  'Art.30': {
    title: 'Key Contractual Provisions',
    pillar: 'TPRM',
    description: 'Ensure contractual arrangements contain all required provisions for ICT services supporting critical functions.',
    requirements: [
      'Complete service descriptions',
      'Service level agreements (SLAs)',
      'Data location and processing requirements',
      'Business continuity provisions',
      'Audit and access rights',
      'Termination rights and exit assistance',
      'Subcontracting chain visibility',
    ],
    remediation: [
      'Develop DORA-compliant contract templates',
      'Define minimum SLA requirements by service tier',
      'Include data residency clauses for EU data',
      'Require provider BCM and incident notification',
      'Negotiate comprehensive audit rights',
      'Include termination and transition assistance clauses',
      'Require approval for critical subcontracting',
    ],
  },
  'Art.31': {
    title: 'Designation of Critical ICT Third-Party Providers',
    pillar: 'TPRM',
    description: 'ESAs designate critical ICT third-party service providers (CTPPs) subject to Union oversight framework.',
    requirements: [
      'Monitor CTPP designations',
      'Understand CTPP oversight requirements',
      'Assess impact of using CTPPs',
      'Consider concentration implications',
    ],
    remediation: [
      'Track ESA CTPP designation announcements',
      'Review contracts with designated CTPPs',
      'Assess operational resilience of CTPP relationships',
      'Document rationale for CTPP usage',
    ],
  },
  // Chapter VI: Information Sharing (Article 45)
  'Art.45': {
    title: 'Information Sharing Arrangements',
    pillar: 'SHARING',
    description: 'Financial entities may exchange cyber threat information and intelligence amongst themselves.',
    requirements: [
      'Information sharing agreements in place',
      'Participation in trusted communities',
      'Secure information exchange mechanisms',
      'Data protection compliance in sharing',
      'Two-way threat intelligence flow',
    ],
    remediation: [
      'Join FS-ISAC or equivalent financial sector ISAC',
      'Establish bilateral sharing agreements with peers',
      'Implement TLP (Traffic Light Protocol) for sharing',
      'Ensure GDPR compliance in threat data sharing',
      'Contribute indicators to community platforms',
    ],
  },
} as const;

export type DORAArticle = keyof typeof DORA_ARTICLES;

export interface GapAnalysisItem {
  article: DORAArticle;
  coverageStatus: 'covered' | 'partial' | 'gap';
  coverageScore: number;
  evidence: Array<{
    controlId: string;
    controlName: string;
    testResult: 'operating_effectively' | 'exception' | 'not_tested';
    mappingStrength: 'full' | 'partial' | 'none';
  }>;
}

interface DORAGapAnalysisProps {
  gaps: GapAnalysisItem[];
  className?: string;
}

export function DORAGapAnalysis({ gaps, className }: DORAGapAnalysisProps) {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  const toggleArticle = (article: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(article)) {
      newExpanded.delete(article);
    } else {
      newExpanded.add(article);
    }
    setExpandedArticles(newExpanded);
  };

  // Group gaps by pillar
  const gapsByPillar = gaps.reduce<Record<string, GapAnalysisItem[]>>((acc, gap) => {
    const pillar = DORA_ARTICLES[gap.article]?.pillar || 'OTHER';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(gap);
    return acc;
  }, {});

  const pillarLabels: Record<string, string> = {
    ICT_RISK: 'ICT Risk Management',
    INCIDENT: 'Incident Reporting',
    RESILIENCE: 'Resilience Testing',
    TPRM: 'Third-Party Risk Management',
    SHARING: 'Information Sharing',
  };

  const getStatusIcon = (status: 'covered' | 'partial' | 'gap') => {
    switch (status) {
      case 'covered':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'gap':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: 'covered' | 'partial' | 'gap') => {
    switch (status) {
      case 'covered':
        return <Badge className="bg-success">Covered</Badge>;
      case 'partial':
        return <Badge variant="outline" className="border-warning text-warning">Partial</Badge>;
      case 'gap':
        return <Badge variant="destructive">Gap</Badge>;
    }
  };

  // Calculate summary stats
  const totalArticles = gaps.length;
  const coveredCount = gaps.filter(g => g.coverageStatus === 'covered').length;
  const partialCount = gaps.filter(g => g.coverageStatus === 'partial').length;
  const gapCount = gaps.filter(g => g.coverageStatus === 'gap').length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg">DORA Compliance Gap Analysis</CardTitle>
        <CardDescription>
          Article-by-article analysis of DORA compliance based on SOC 2 control mapping
        </CardDescription>

        {/* Summary Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">{coveredCount} Covered</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">{partialCount} Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{gapCount} Gaps</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(gapsByPillar).map(([pillar, pillarGaps]) => (
          <div key={pillar} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {pillarLabels[pillar] || pillar}
            </h4>

            <div className="space-y-2">
              {pillarGaps.map((gap) => {
                const articleInfo = DORA_ARTICLES[gap.article];
                const isExpanded = expandedArticles.has(gap.article);

                return (
                  <Collapsible
                    key={gap.article}
                    open={isExpanded}
                    onOpenChange={() => toggleArticle(gap.article)}
                  >
                    <div
                      className={cn(
                        'border rounded-lg overflow-hidden',
                        gap.coverageStatus === 'gap' && 'border-destructive/50',
                        gap.coverageStatus === 'partial' && 'border-warning/50'
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
                          {getStatusIcon(gap.coverageStatus)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{gap.article}</span>
                              <span className="text-muted-foreground truncate">
                                {articleInfo?.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={gap.coverageScore}
                                className="h-1.5 w-24"
                              />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(gap.coverageScore)}%
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(gap.coverageStatus)}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-4">
                          {/* Article Description */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {articleInfo?.description}
                            </p>
                          </div>

                          {/* Requirements */}
                          {articleInfo?.requirements && (
                            <div>
                              <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Requirements
                              </h5>
                              <ul className="text-sm space-y-1">
                                {articleInfo.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* SOC 2 Evidence */}
                          {gap.evidence.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                SOC 2 Evidence ({gap.evidence.length} controls)
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {gap.evidence.map((ev) => (
                                  <Badge
                                    key={ev.controlId}
                                    variant={
                                      ev.testResult === 'operating_effectively'
                                        ? 'secondary'
                                        : ev.testResult === 'exception'
                                          ? 'outline'
                                          : 'secondary'
                                    }
                                    className={cn(
                                      'font-mono',
                                      ev.testResult === 'exception' &&
                                        'border-warning text-warning'
                                    )}
                                  >
                                    {ev.controlId}
                                    {ev.mappingStrength === 'partial' && ' (partial)'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Remediation Recommendations */}
                          {gap.coverageStatus !== 'covered' && articleInfo?.remediation && (
                            <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                              <h5 className="text-xs font-medium uppercase text-info mb-2 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Remediation Recommendations
                              </h5>
                              <ul className="text-sm space-y-1">
                                {articleInfo.remediation.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-info">→</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
