'use client';

import { useState } from 'react';
import { FileText, Link as LinkIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { RequirementWithEvidence, DORAEvidence } from './types';

interface AddEvidenceFormProps {
  requirement: RequirementWithEvidence;
  vendorId: string;
  onSuccess: (evidence: DORAEvidence) => void;
}

export function AddEvidenceForm({
  requirement,
  vendorId,
  onSuccess,
}: AddEvidenceFormProps) {
  const [evidenceType, setEvidenceType] = useState<'attestation' | 'link' | 'document'>('attestation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('No organization found');

      const evidenceData = {
        organization_id: userData.organization_id,
        vendor_id: vendorId,
        requirement_id: requirement.id,
        evidence_type: evidenceType,
        title,
        description,
        external_link: evidenceType === 'link' ? externalLink : null,
        attested_by: evidenceType === 'attestation' ? user.id : null,
        attested_at: evidenceType === 'attestation' ? new Date().toISOString() : null,
        attestation_statement: evidenceType === 'attestation' ? description : null,
        status: 'pending',
        created_by: user.id,
      };

      const { data, error: insertError } = await supabase
        .from('dora_evidence')
        .insert(evidenceData)
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess(data);

      // Reset form
      setTitle('');
      setDescription('');
      setExternalLink('');
    } catch (err) {
      console.error('Error adding evidence:', err);
      setError(err instanceof Error ? err.message : 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Evidence for {requirement.article_number}</DialogTitle>
        <DialogDescription>{requirement.article_title}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Evidence needed hint */}
        {requirement.evidence_needed && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-1">Suggested evidence:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              {requirement.evidence_needed.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence Type */}
        <div className="space-y-2">
          <Label>Evidence Type</Label>
          <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as typeof evidenceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attestation">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Self-Attestation
                </div>
              </SelectItem>
              <SelectItem value="link">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  External Link
                </div>
              </SelectItem>
              <SelectItem value="document">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Reference
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder={
              evidenceType === 'attestation'
                ? 'e.g., Internal Policy Compliance'
                : evidenceType === 'link'
                ? 'e.g., Incident Response Procedure'
                : 'e.g., ICT Risk Framework v2.1'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* External Link (for link type) */}
        {evidenceType === 'link' && (
          <div className="space-y-2">
            <Label htmlFor="link">URL</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              required
            />
          </div>
        )}

        {/* Description / Statement */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {evidenceType === 'attestation' ? 'Attestation Statement' : 'Description'}
          </Label>
          <Textarea
            id="description"
            placeholder={
              evidenceType === 'attestation'
                ? 'Describe how your organization meets this requirement...'
                : 'Describe the evidence and how it addresses this requirement...'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add Evidence'}
        </Button>
      </DialogFooter>
    </form>
  );
}
