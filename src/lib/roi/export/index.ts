/**
 * RoI Export Module
 *
 * Supports both xBRL-CSV (primary) and XBRL-XML (alternative) formats
 * for ESA DORA Register of Information submissions.
 */

export {
  generateCsv,
  generateAllCsvFiles,
  parseCsv,
  type CsvGeneratorOptions,
  type CsvGeneratorResult,
} from './csv-generator';

export {
  buildPackageFiles,
  buildPackageZip,
  buildRoiPackage,
  buildPackageWithProgress,
  type BuildPackageOptions,
  type PackageFile,
  type StreamingExportOptions,
} from './package-builder';

export {
  generateParametersCsv,
  getDefaultParameters,
  parseParametersCsv,
  validateParameters,
} from './parameters';

// XBRL-XML Export (alternative format)
export {
  generateXbrlInstance,
  generateXbrlPackage,
  validateXbrlStructure,
  type XmlGeneratorOptions,
  type XmlGeneratorResult,
  type XmlPackageResult,
} from './xml-generator';
