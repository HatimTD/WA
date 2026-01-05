# NetSuite ERP Integration

This document describes the NetSuite ERP integration implemented in the Case Study Builder application.

## Overview

The NetSuite integration allows users to search and select customers from NetSuite when creating case studies. When a customer is selected, their information (company name, location, country, industry) is automatically populated in the form.

## Features

- **OAuth 1.0 Authentication**: Secure authentication using OAuth 1.0 with HMAC-SHA256 signatures
- **Customer Search**: Real-time search of NetSuite customers with debounced input
- **Auto-fill**: Automatically populates location, country, and industry fields from NetSuite data
- **Fallback Support**: Includes mock data for development/testing when credentials are not configured
- **Keyboard Navigation**: Full keyboard support (arrow keys, Enter, Escape)

## Architecture

### Files Created

1. **lib/integrations/netsuite.ts**
   - NetSuite client with OAuth 1.0 authentication
   - Customer search and retrieval methods
   - Mock data fallback for development

2. **lib/actions/netsuite-actions.ts**
   - Server actions for customer search
   - Server actions for customer retrieval
   - Server actions for syncing customer data to case studies

3. **components/netsuite-customer-search.tsx**
   - Autocomplete search component
   - Debounced search (300ms)
   - Dropdown with customer details
   - Keyboard navigation support

### Database Schema Changes

Added to `CaseStudy` model:
```prisma
netsuiteCustomerId    String?
netsuiteSyncedAt      DateTime?
```

## Setup Instructions

### 1. NetSuite Configuration

In NetSuite, you need to:

1. Enable SuiteTalk REST Web Services
2. Create an Integration Record:
   - Go to Setup > Integration > Manage Integrations > New
   - Enable "Token-Based Authentication"
   - Save and note the Consumer Key and Consumer Secret

3. Create Access Token:
   - Go to Setup > Users/Roles > Access Tokens > New
   - Select the Integration Record created above
   - Select appropriate User and Role
   - Save and note the Token ID and Token Secret

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# NetSuite ERP Integration
NETSUITE_ACCOUNT_ID="your-account-id"
NETSUITE_CONSUMER_KEY="your-consumer-key"
NETSUITE_CONSUMER_SECRET="your-consumer-secret"
NETSUITE_TOKEN_ID="your-token-id"
NETSUITE_TOKEN_SECRET="your-token-secret"
NETSUITE_REST_URL="https://your-account-id.suitetalk.api.netsuite.com/services/rest"
```

### 3. Database Migration

Run the Prisma migration:

```bash
npx prisma migrate dev --name add_netsuite_fields
npx prisma generate
```

## Usage

### In Case Study Form (Step 2)

The customer name field now includes NetSuite integration:

1. Start typing a customer name
2. After 300ms, the system searches NetSuite
3. Select a customer from the dropdown
4. Location, country, and industry are auto-filled

### Programmatic Usage

```typescript
import { searchNetSuiteCustomers, getNetSuiteCustomer } from '@/lib/actions/netsuite-actions';

// Search customers
const result = await searchNetSuiteCustomers('ABC Mining');
if (result.success && result.customers) {
  console.log(result.customers);
}

// Get specific customer
const customer = await getNetSuiteCustomer('1001');
if (customer.success && customer.customer) {
  console.log(customer.customer);
}
```

## Mock Data

For development without NetSuite credentials, the integration includes mock data:

- ABC Mining Corporation (Perth, Australia)
- Global Steel Industries (Pittsburgh, United States)
- Cement Works Ltd (Mumbai, India)
- PowerGen Energy Solutions (Houston, United States)
- Marine Services International (Singapore)

Mock data is automatically used when NetSuite credentials are not configured.

## API Details

### NetSuite REST API Endpoints Used

1. **SuiteQL Query**: `/services/rest/query/v1/suiteql`
   - Used for searching customers
   - Supports SQL-like queries

2. **Record API**: `/services/rest/record/v1/customer/{id}`
   - Used for retrieving specific customer details

### OAuth 1.0 Signature Generation

The integration implements OAuth 1.0 signature generation:

1. Generate timestamp and nonce
2. Create signature base string
3. Generate HMAC-SHA256 signature
4. Build Authorization header

## Security Considerations

1. **Credentials**: All NetSuite credentials are stored in environment variables
2. **Server-Side**: All NetSuite API calls are made server-side via server actions
3. **OAuth 1.0**: Uses industry-standard OAuth 1.0 authentication
4. **Error Handling**: Graceful error handling with fallback to mock data

## Troubleshooting

### No results in search
- Verify NetSuite credentials are correct
- Check NetSuite user has permission to access customer records
- Verify SuiteTalk is enabled for the account

### Authentication errors
- Verify Consumer Key and Secret match the Integration Record
- Verify Token ID and Secret are valid and not expired
- Check the Account ID is correct

### Connection errors
- Verify NETSUITE_REST_URL is correct
- Check firewall/network settings
- Verify NetSuite account is active

## Future Enhancements

Potential improvements:

1. **Bi-directional Sync**: Sync case studies back to NetSuite
2. **Custom Records**: Support for NetSuite custom records
3. **Additional Fields**: Sync more customer fields (contact info, sales rep, etc.)
4. **Caching**: Implement caching for frequently accessed customers
5. **Webhooks**: Real-time updates via NetSuite webhooks

## References

- [NetSuite SuiteTalk REST API Documentation](https://system.netsuite.com/app/help/helpcenter.nl?fid=book_1559132836.html)
- [NetSuite OAuth 1.0 Authentication](https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4389727047.html)
- [SuiteQL Reference](https://system.netsuite.com/app/help/helpcenter.nl?fid=section_1510275107.html)
