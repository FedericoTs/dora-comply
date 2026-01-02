-- ============================================
-- Migration 007: Add INSERT policy for parsed_soc2
-- ============================================
-- The parsed_soc2 table was missing an INSERT policy,
-- preventing the SOC 2 parsing API from storing results.

-- Allow users to insert parsed_soc2 records for documents in their org
CREATE POLICY "Users can create parsed_soc2 for org documents"
  ON parsed_soc2 FOR INSERT
  WITH CHECK (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

-- Also add UPDATE and DELETE policies for completeness
CREATE POLICY "Users can update parsed_soc2 for org documents"
  ON parsed_soc2 FOR UPDATE
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can delete parsed_soc2 for org documents"
  ON parsed_soc2 FOR DELETE
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));
