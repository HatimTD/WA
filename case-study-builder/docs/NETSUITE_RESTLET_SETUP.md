# NetSuite RESTlet Setup Guide

This document provides the SuiteScript 2.0 code and deployment instructions for the NetSuite RESTlet that receives PDF uploads from the ICA Case Study Builder.

## Overview

The ICA Case Study Builder pushes published case study PDFs to NetSuite customer records. This requires a custom RESTlet deployed in NetSuite.

**Integration Flow:**
1. Case study is published in ICA
2. ICA calls the NetSuite RESTlet with the PDF (base64 encoded)
3. RESTlet saves file to File Cabinet
4. RESTlet attaches file to customer record
5. RESTlet returns success/failure response

---

## Prerequisites

1. **NetSuite Role Permissions:**
   - Lists > Documents and Files (Full)
   - Lists > Customers (View/Edit)
   - Setup > SuiteScript (Full)
   - Setup > REST Web Services (Full)

2. **File Cabinet Folder:**
   - Create a folder in File Cabinet: `SuiteScripts > CaseStudies`
   - Note the Folder ID (needed in environment variables)

3. **Custom Fields on Customer Record (Optional):**
   - `custentity_last_case_study_id` (Text)
   - `custentity_last_case_study_title` (Text)
   - `custentity_last_case_study_date` (Date)
   - `custentity_last_case_study_url` (URL)

---

## SuiteScript 2.0 RESTlet Code

Create a new SuiteScript file: `wa_casestudy_restlet.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope Public
 *
 * RESTlet for ICA Case Study Builder Integration
 * Receives PDF uploads and attaches to customer records
 *
 * Deployed by: [Your Name]
 * Date: [Date]
 */
define(['N/file', 'N/record', 'N/log', 'N/encode'],
  function(file, record, log, encode) {

    /**
     * POST handler - receives PDF and attaches to customer
     * @param {Object} context - Request body
     * @returns {Object} Response with success/failure
     */
    function post(context) {
      log.debug('ICA RESTlet', 'Received request: ' + JSON.stringify({
        action: context.action,
        customerId: context.customerId,
        fileName: context.fileName
      }));

      try {
        // Validate required fields
        if (!context.action) {
          return { success: false, error: 'Missing action parameter' };
        }

        if (context.action === 'uploadAndAttach') {
          return handleUploadAndAttach(context);
        } else if (context.action === 'updateMetadata') {
          return handleUpdateMetadata(context);
        } else {
          return { success: false, error: 'Unknown action: ' + context.action };
        }

      } catch (e) {
        log.error('ICA RESTlet Error', e.message);
        return { success: false, error: e.message };
      }
    }

    /**
     * Upload PDF to File Cabinet and attach to customer
     */
    function handleUploadAndAttach(context) {
      // Validate required parameters
      if (!context.customerId) {
        return { success: false, error: 'Missing customerId' };
      }
      if (!context.fileName) {
        return { success: false, error: 'Missing fileName' };
      }
      if (!context.fileContent) {
        return { success: false, error: 'Missing fileContent (base64)' };
      }

      // Decode base64 content
      var decodedContent = encode.convert({
        string: context.fileContent,
        inputEncoding: encode.Encoding.BASE_64,
        outputEncoding: encode.Encoding.UTF_8
      });

      // Create file in File Cabinet
      var pdfFile = file.create({
        name: context.fileName,
        fileType: file.Type.PDF,
        contents: context.fileContent, // PDF stays as base64
        encoding: file.Encoding.BASE_64,
        folder: context.folderId || -15, // Default to SuiteScripts folder if not specified
        isOnline: false,
        description: 'Case Study: ' + (context.metadata ? context.metadata.caseStudyTitle : 'Unknown')
      });

      var fileId = pdfFile.save();
      log.audit('ICA RESTlet', 'File created: ' + fileId);

      // Attach file to customer record
      record.attach({
        record: {
          type: 'file',
          id: fileId
        },
        to: {
          type: record.Type.CUSTOMER,
          id: context.customerId
        }
      });

      log.audit('ICA RESTlet', 'File attached to customer: ' + context.customerId);

      // Update customer record with metadata (optional)
      if (context.metadata) {
        try {
          record.submitFields({
            type: record.Type.CUSTOMER,
            id: context.customerId,
            values: {
              custentity_last_case_study_id: context.metadata.caseStudyId || '',
              custentity_last_case_study_title: context.metadata.caseStudyTitle || '',
              custentity_last_case_study_date: new Date(context.metadata.publishedAt)
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true
            }
          });
        } catch (metaError) {
          log.warning('ICA RESTlet', 'Could not update metadata fields: ' + metaError.message);
          // Don't fail the whole operation if metadata update fails
        }
      }

      return {
        success: true,
        fileId: String(fileId),
        customerId: context.customerId,
        fileName: context.fileName
      };
    }

    /**
     * Update customer metadata only (no file upload)
     */
    function handleUpdateMetadata(context) {
      if (!context.customerId) {
        return { success: false, error: 'Missing customerId' };
      }

      record.submitFields({
        type: record.Type.CUSTOMER,
        id: context.customerId,
        values: {
          custentity_last_case_study_id: context.caseStudyId || '',
          custentity_last_case_study_title: context.caseStudyTitle || '',
          custentity_last_case_study_date: context.publishedAt ? new Date(context.publishedAt) : null,
          custentity_last_case_study_url: context.caseStudyUrl || ''
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true
        }
      });

      return {
        success: true,
        customerId: context.customerId
      };
    }

    return {
      post: post
    };
  }
);
```

---

## Deployment Steps

### Step 1: Upload Script File

1. Go to **Customization > Scripting > Scripts > New**
2. Upload the `wa_casestudy_restlet.js` file
3. Click **Create Script Record**

### Step 2: Create Script Record

1. **Name:** WA Case Study RESTlet
2. **ID:** `_wa_casestudy_restlet`
3. **Script File:** Select the uploaded file
4. Click **Save**

### Step 3: Deploy Script

1. Go to the **Deployments** subtab
2. Click **New Deployment**
3. Configure:
   - **Title:** WA Case Study RESTlet Deployment
   - **ID:** `_wa_casestudy_restlet_deploy`
   - **Status:** Released
   - **Log Level:** Audit
   - **Execute As Role:** A role with required permissions
   - **Audience:** All Roles (or specific integration role)
4. Click **Save**
5. **Copy the External URL** - this is your RESTlet URL

---

## Environment Variables

Add these to your ICA `.env` file:

```env
# NetSuite RESTlet Configuration
NETSUITE_RESTLET_URL=https://[ACCOUNT_ID].restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1

# Folder ID in NetSuite File Cabinet for Case Study PDFs
NETSUITE_CASE_STUDY_FOLDER_ID=12345
```

Replace:
- `[ACCOUNT_ID]` with your NetSuite account ID
- `script=123` with your script's internal ID
- `deploy=1` with your deployment number
- `12345` with your File Cabinet folder ID

---

## Testing

### Test from NetSuite (SuiteScript Debugger)

```javascript
// Test payload
var testPayload = {
  action: 'uploadAndAttach',
  customerId: '1234', // Use a test customer ID
  fileName: 'Test_CaseStudy.pdf',
  fileContent: 'JVBERi0xLjQK...', // Small base64 PDF
  folderId: '12345',
  metadata: {
    caseStudyId: 'test-123',
    caseStudyTitle: 'Test Case Study',
    caseType: 'APPLICATION',
    publishedAt: '2025-01-15T00:00:00Z',
    createdBy: 'Test User'
  }
};
```

### Test from ICA

The integration will automatically push PDFs when case studies are published.

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `INVALID_LOGIN` | Check OAuth credentials in ICA |
| `PERMISSION_DENIED` | Verify role has File Cabinet access |
| `RECORD_NOT_FOUND` | Customer ID doesn't exist in NetSuite |
| `INVALID_FOLDER` | Folder ID doesn't exist or no access |
| `FILE_SIZE_EXCEEDED` | PDF > 10MB (NetSuite limit) |

### Logs

Check NetSuite logs at: **Customization > Scripting > Script Logs**

Filter by:
- Script: WA Case Study RESTlet
- Log Level: Audit, Debug, Error

---

## Security Considerations

1. **OAuth 1.0 Authentication** - All requests are signed with OAuth
2. **Role-Based Access** - RESTlet runs under specific role with limited permissions
3. **Input Validation** - All parameters validated before processing
4. **Audit Logging** - All operations logged for compliance

---

## Custom Fields Reference

If using metadata update functionality, create these custom fields on the Customer record:

| Field ID | Label | Type |
|----------|-------|------|
| `custentity_last_case_study_id` | Last Case Study ID | Text (50) |
| `custentity_last_case_study_title` | Last Case Study Title | Text (200) |
| `custentity_last_case_study_date` | Last Case Study Date | Date |
| `custentity_last_case_study_url` | Last Case Study URL | URL |

---

## Support

For issues with this integration, contact:
- ICA Development Team
- NetSuite Administrator
