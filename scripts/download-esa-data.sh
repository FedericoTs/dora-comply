#!/bin/bash
# ESA DORA Data Download Script
# Downloads official EBA templates and taxonomy files for DORA RoI implementation

set -e

BASE_DIR="$(dirname "$0")/../data/esa"
EBA_BASE="https://www.eba.europa.eu/sites/default/files"

echo "Creating directories..."
mkdir -p "$BASE_DIR"/{templates,samples,taxonomy,validation,guides}

echo "Downloading ESA DORA RoI files..."

# Templates - Annotated Table Layouts
echo "[1/5] Downloading annotated templates..."
curl -L -o "$BASE_DIR/templates/annotated_templates.zip" \
  "$EBA_BASE/2024-12/7ae0363a-ad3d-42d9-a192-34711416c039/annotated_templates.zip"

# Sample xBRL-CSV instances
echo "[2/5] Downloading sample documents..."
curl -L -o "$BASE_DIR/samples/sample_documents.zip" \
  "$EBA_BASE/2024-12/f4519b45-d6c2-4e7d-a8d4-4bee91a9c530/sample_documents.zip"

# Taxonomy package (latest errata)
echo "[3/5] Downloading taxonomy package..."
curl -L -o "$BASE_DIR/taxonomy/taxo_package_4.0.zip" \
  "$EBA_BASE/2025-03/729fe4f5-bbcc-495d-b520-8ad5cbeeead0/taxo_package_4.0_errata5.zip"

# DPM Glossary
echo "[4/5] Downloading DPM glossary..."
curl -L -o "$BASE_DIR/validation/dpm_glossary.xlsx" \
  "$EBA_BASE/2025-01/eee6cdde-536f-448a-8c42-75752f536d75/dpm2_4_0_glossary_20250129.xlsx"

# Validation Rules
echo "[5/5] Downloading validation rules..."
curl -L -o "$BASE_DIR/validation/validation_rules.xlsx" \
  "$EBA_BASE/2025-03/de521052-1069-4e43-a08b-43aaeb938a35/EBA%20Validation%20Rules%202025-03-20%20deactivation.xlsx"

echo "Extracting archives..."

# Extract templates
cd "$BASE_DIR/templates"
unzip -o annotated_templates.zip

# Extract samples
cd "$BASE_DIR/samples"
unzip -o sample_documents.zip
# Extract DORA sample specifically
mkdir -p dora
unzip -o "*.DORA*.zip" -d dora/ 2>/dev/null || true

# Extract taxonomy
cd "$BASE_DIR/taxonomy"
unzip -o taxo_package_4.0.zip
unzip -o EBA_XBRL_4.0_Dictionary_4.0.0.0.zip -d dictionary/

echo ""
echo "Download complete!"
echo ""
echo "Files downloaded:"
find "$BASE_DIR" -type f -name "*.xlsx" -o -name "*.csv" -o -name "*.json" | wc -l
echo ""
echo "Key files:"
echo "  - DORA Template: $BASE_DIR/templates/*DORADORA*.xlsx"
echo "  - Sample CSVs:   $BASE_DIR/samples/dora/*/reports/*.csv"
echo "  - DPM Glossary:  $BASE_DIR/validation/dpm_glossary.xlsx"
echo "  - Validation:    $BASE_DIR/validation/validation_rules.xlsx"
