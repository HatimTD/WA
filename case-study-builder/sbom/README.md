# Software Bill of Materials (SBOM)

## WA Policy V2.3 Compliance - Section 6.1

This directory contains automatically generated SBOM files for the Case Study Builder application.

## Generated Files

- `sbom.json` - CycloneDX format SBOM in JSON
- `sbom.xml` - CycloneDX format SBOM in XML

## Generating SBOMs

```bash
# Generate JSON format
npm run sbom:generate

# Generate XML format
npm run sbom:generate:xml

# Generate both formats
npm run security:sbom
```

## CI/CD Integration

SBOMs are automatically generated during the CI/CD pipeline and stored as build artifacts.

## Purpose

Per WA Software Development Policy V2.3 Section 6.1, all applications must maintain a Software Bill of Materials to:

1. Track all third-party dependencies
2. Enable vulnerability scanning
3. Support compliance audits
4. Facilitate security incident response

## Format

Uses [CycloneDX](https://cyclonedx.org/) format, an industry-standard SBOM specification.
