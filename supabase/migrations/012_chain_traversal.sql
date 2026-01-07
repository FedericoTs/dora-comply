-- ============================================
-- Fourth-Party Chain Traversal Functions
-- Supports DORA Article 28(8) subcontracting visibility
-- ============================================

-- Recursive function to get full subcontractor chain for a vendor
CREATE OR REPLACE FUNCTION get_subcontractor_chain(p_vendor_id UUID)
RETURNS SETOF subcontractors
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE chain AS (
    -- Base case: direct subcontractors
    SELECT s.*, 1 as computed_depth
    FROM subcontractors s
    WHERE s.vendor_id = p_vendor_id
      AND s.parent_subcontractor_id IS NULL

    UNION ALL

    -- Recursive case: sub-subcontractors
    SELECT s.*, c.computed_depth + 1
    FROM subcontractors s
    JOIN chain c ON s.parent_subcontractor_id = c.id
    WHERE c.computed_depth < 10  -- Safety limit
  )
  SELECT
    id, vendor_id, service_id, organization_id,
    subcontractor_name, subcontractor_lei, country_code,
    tier_level, parent_subcontractor_id,
    service_description, service_type,
    supports_critical_function, is_monitored,
    last_assessment_date, risk_rating,
    created_at, updated_at
  FROM chain
  ORDER BY computed_depth, subcontractor_name;
$$;

-- Function to calculate chain depth for a vendor
CREATE OR REPLACE FUNCTION get_vendor_chain_depth(p_vendor_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(MAX(tier_level), 0)
  FROM subcontractors
  WHERE vendor_id = p_vendor_id;
$$;

-- Function to get aggregate chain metrics for an organization
CREATE OR REPLACE FUNCTION get_org_chain_metrics(p_org_id UUID)
RETURNS TABLE (
  total_vendors INTEGER,
  vendors_with_chains INTEGER,
  total_subcontractors BIGINT,
  max_chain_depth INTEGER,
  avg_chain_depth NUMERIC,
  critical_at_depth BIGINT,
  unmonitored_count BIGINT,
  high_risk_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH vendor_stats AS (
    SELECT
      v.id as vendor_id,
      COUNT(s.id) as sub_count,
      COALESCE(MAX(s.tier_level), 0) as max_depth,
      COALESCE(AVG(s.tier_level), 0) as avg_depth
    FROM vendors v
    LEFT JOIN subcontractors s ON s.vendor_id = v.id
    WHERE v.organization_id = p_org_id
      AND v.status = 'active'
    GROUP BY v.id
  ),
  sub_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE s.supports_critical_function AND s.tier_level > 2) as critical_deep,
      COUNT(*) FILTER (WHERE NOT s.is_monitored) as unmonitored,
      COUNT(*) FILTER (WHERE s.risk_rating = 'high') as high_risk,
      COUNT(*) as total_subs
    FROM subcontractors s
    JOIN vendors v ON s.vendor_id = v.id
    WHERE v.organization_id = p_org_id
      AND v.status = 'active'
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM vendor_stats),
    (SELECT COUNT(*)::INTEGER FROM vendor_stats WHERE sub_count > 0),
    (SELECT total_subs FROM sub_stats),
    (SELECT COALESCE(MAX(max_depth), 0)::INTEGER FROM vendor_stats),
    (SELECT ROUND(AVG(avg_depth), 2) FROM vendor_stats WHERE sub_count > 0),
    (SELECT critical_deep FROM sub_stats),
    (SELECT unmonitored FROM sub_stats),
    (SELECT high_risk FROM sub_stats);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_subcontractor_chain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_chain_depth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_chain_metrics(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_subcontractor_chain IS
  'Recursively retrieves full subcontractor chain for a vendor, supporting DORA Article 28(8) visibility requirements';

COMMENT ON FUNCTION get_org_chain_metrics IS
  'Calculates aggregate fourth-party risk metrics for an organization''s vendor ecosystem';
