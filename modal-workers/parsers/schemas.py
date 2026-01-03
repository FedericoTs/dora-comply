"""
JSON Schemas for Gemini Structured Output Mode.

These schemas ensure Gemini returns properly formatted JSON without parse errors.
"""

# ============================================================================
# Full SOC 2 Extraction Schema (Single-Pass)
# ============================================================================

FULL_EXTRACTION_SCHEMA = {
    "type": "object",
    "required": ["metadata", "controls", "exceptions", "subserviceOrgs", "cuecs"],
    "properties": {
        "metadata": {
            "type": "object",
            "required": ["reportType", "auditFirm", "opinion", "periodStart", "periodEnd", "serviceOrgName"],
            "properties": {
                "reportType": {
                    "type": "string",
                    "enum": ["type1", "type2"],
                    "description": "SOC 2 Type 1 or Type 2"
                },
                "auditFirm": {
                    "type": "string",
                    "description": "Name of the CPA firm that performed the audit"
                },
                "opinion": {
                    "type": "string",
                    "enum": ["unqualified", "qualified", "adverse"],
                    "description": "Auditor's opinion on the report"
                },
                "periodStart": {
                    "type": "string",
                    "description": "Start date of audit period (YYYY-MM-DD)"
                },
                "periodEnd": {
                    "type": "string",
                    "description": "End date of audit period (YYYY-MM-DD)"
                },
                "serviceOrgName": {
                    "type": "string",
                    "description": "Name of the service organization"
                },
                "trustServicesCriteria": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["security", "availability", "processing_integrity", "confidentiality", "privacy"]
                    },
                    "description": "Trust Services Criteria categories covered"
                },
                "systemDescription": {
                    "type": "string",
                    "description": "Brief description of the system covered"
                }
            }
        },
        "controls": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["controlId", "tscCategory", "description", "testResult"],
                "properties": {
                    "controlId": {
                        "type": "string",
                        "description": "Control identifier (e.g., CC1.1, A1.2, SEC-01)"
                    },
                    "tscCategory": {
                        "type": "string",
                        "description": "TSC category: CC1-CC9 for Common Criteria, A for Availability, PI for Processing Integrity, C for Confidentiality, P for Privacy"
                    },
                    "description": {
                        "type": "string",
                        "description": "Full control description from the report"
                    },
                    "testResult": {
                        "type": "string",
                        "enum": ["operating_effectively", "exception", "not_tested"],
                        "description": "Test result status"
                    },
                    "pageRef": {
                        "type": "integer",
                        "description": "Page number where this control appears"
                    }
                }
            }
        },
        "exceptions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["controlId", "description"],
                "properties": {
                    "controlId": {
                        "type": "string",
                        "description": "Control ID that has the exception"
                    },
                    "controlArea": {
                        "type": "string",
                        "description": "Control area/category"
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the exception/deviation"
                    },
                    "managementResponse": {
                        "type": "string",
                        "description": "Management's response to the exception"
                    },
                    "pageRef": {
                        "type": "integer",
                        "description": "Page number"
                    }
                }
            }
        },
        "subserviceOrgs": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "serviceDescription"],
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Subservice organization name"
                    },
                    "serviceDescription": {
                        "type": "string",
                        "description": "Services provided by the subservice org"
                    },
                    "carveOut": {
                        "type": "boolean",
                        "description": "Whether the org is carved out of scope"
                    },
                    "pageRef": {
                        "type": "integer",
                        "description": "Page number"
                    }
                }
            }
        },
        "cuecs": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["description", "customerResponsibility"],
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "CUEC identifier if provided"
                    },
                    "description": {
                        "type": "string",
                        "description": "CUEC description"
                    },
                    "customerResponsibility": {
                        "type": "string",
                        "description": "What the customer is responsible for"
                    },
                    "relatedControl": {
                        "type": "string",
                        "description": "Related SOC 2 control ID"
                    },
                    "pageRef": {
                        "type": "integer",
                        "description": "Page number"
                    }
                }
            }
        }
    }
}


# ============================================================================
# Metadata-Only Schema (Two-Pass: Phase 1)
# ============================================================================

METADATA_SCHEMA = {
    "type": "object",
    "required": ["metadata", "documentStats"],
    "properties": {
        "metadata": {
            "type": "object",
            "required": ["reportType", "auditFirm", "opinion", "periodStart", "periodEnd", "serviceOrgName"],
            "properties": {
                "reportType": {"type": "string", "enum": ["type1", "type2"]},
                "auditFirm": {"type": "string"},
                "opinion": {"type": "string", "enum": ["unqualified", "qualified", "adverse"]},
                "periodStart": {"type": "string"},
                "periodEnd": {"type": "string"},
                "serviceOrgName": {"type": "string"},
                "trustServicesCriteria": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["security", "availability", "processing_integrity", "confidentiality", "privacy"]
                    }
                },
                "systemDescription": {"type": "string"}
            }
        },
        "documentStats": {
            "type": "object",
            "properties": {
                "totalControls": {"type": "integer", "description": "Estimated total control count"},
                "totalExceptions": {"type": "integer", "description": "Number of exceptions"},
                "hasSubserviceOrgs": {"type": "boolean"},
                "hasCuecs": {"type": "boolean"},
                "controlSectionPages": {"type": "string", "description": "Page range for controls section"}
            }
        },
        "subserviceOrgs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "serviceDescription": {"type": "string"},
                    "carveOut": {"type": "boolean"}
                }
            }
        },
        "cuecs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "description": {"type": "string"},
                    "customerResponsibility": {"type": "string"}
                }
            }
        }
    }
}


# ============================================================================
# Controls-Only Schema (Two-Pass: Phase 2)
# ============================================================================

CONTROLS_SCHEMA = {
    "type": "object",
    "required": ["controls", "exceptions"],
    "properties": {
        "controls": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["controlId", "tscCategory", "description", "testResult"],
                "properties": {
                    "controlId": {"type": "string"},
                    "tscCategory": {"type": "string"},
                    "description": {"type": "string"},
                    "testResult": {
                        "type": "string",
                        "enum": ["operating_effectively", "exception", "not_tested"]
                    },
                    "pageRef": {"type": "integer"}
                }
            }
        },
        "exceptions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["controlId", "description"],
                "properties": {
                    "controlId": {"type": "string"},
                    "controlArea": {"type": "string"},
                    "description": {"type": "string"},
                    "managementResponse": {"type": "string"},
                    "pageRef": {"type": "integer"}
                }
            }
        }
    }
}


# ============================================================================
# Parallel Extraction Schemas
# ============================================================================

# Controls CC1-CC5 only
CONTROLS_CC1_CC5_SCHEMA = {
    "type": "object",
    "required": ["controls"],
    "properties": {
        "controls": {
            "type": "array",
            "description": "Controls from CC1-CC5 categories only",
            "items": {
                "type": "object",
                "required": ["controlId", "tscCategory", "description", "testResult"],
                "properties": {
                    "controlId": {"type": "string"},
                    "tscCategory": {"type": "string"},
                    "description": {"type": "string"},
                    "testResult": {
                        "type": "string",
                        "enum": ["operating_effectively", "exception", "not_tested"]
                    },
                    "pageRef": {"type": "integer"}
                }
            }
        }
    }
}

# Controls CC6-CC9 + Additional criteria
CONTROLS_CC6_PLUS_SCHEMA = {
    "type": "object",
    "required": ["controls", "exceptions"],
    "properties": {
        "controls": {
            "type": "array",
            "description": "Controls from CC6-CC9, A, PI, C, P categories",
            "items": {
                "type": "object",
                "required": ["controlId", "tscCategory", "description", "testResult"],
                "properties": {
                    "controlId": {"type": "string"},
                    "tscCategory": {"type": "string"},
                    "description": {"type": "string"},
                    "testResult": {
                        "type": "string",
                        "enum": ["operating_effectively", "exception", "not_tested"]
                    },
                    "pageRef": {"type": "integer"}
                }
            }
        },
        "exceptions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["controlId", "description"],
                "properties": {
                    "controlId": {"type": "string"},
                    "description": {"type": "string"},
                    "managementResponse": {"type": "string"}
                }
            }
        }
    }
}


def get_schema_for_strategy(strategy: str, phase: str = "full") -> dict:
    """Get the appropriate schema based on extraction strategy and phase."""
    if strategy == "single_pass":
        return FULL_EXTRACTION_SCHEMA
    elif strategy == "two_pass":
        if phase == "metadata":
            return METADATA_SCHEMA
        return CONTROLS_SCHEMA
    elif strategy == "parallel":
        if phase == "metadata":
            return METADATA_SCHEMA
        elif phase == "cc1_cc5":
            return CONTROLS_CC1_CC5_SCHEMA
        elif phase == "cc6_plus":
            return CONTROLS_CC6_PLUS_SCHEMA
        return CONTROLS_SCHEMA
    return FULL_EXTRACTION_SCHEMA
