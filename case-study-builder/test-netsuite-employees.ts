/**
 * NetSuite Employee Endpoint Test Script
 *
 * Purpose: Verify actual employee data structure from NetSuite API
 * Tests if subsidiary fields exist for employees
 *
 * Run with: npx ts-node test-netsuite-employees.ts
 */

import { netsuiteClient } from './lib/integrations/netsuite';

async function testNetSuiteEmployees() {
  console.log('🧪 Testing NetSuite Employee Endpoint\n');
  console.log('='.repeat(60));

  try {
    console.log('\n📡 Fetching ALL employees from NetSuite...');
    console.log('This may take 30-60 seconds on first fetch...\n');

    const startTime = Date.now();

    // Fetch all employees using the public method
    const employees = await netsuiteClient.searchEmployees();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched ${employees.length} employees in ${duration}s\n`);

    if (!employees || employees.length === 0) {
      console.error('❌ No employees returned from NetSuite');
      return;
    }

    // Analyze first employee structure
    console.log('📋 First Employee Structure:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(employees[0], null, 2));
    console.log('='.repeat(60));

    // Check for subsidiary fields
    console.log('\n🔍 Checking for Subsidiary Fields:');
    console.log('='.repeat(60));

    const firstEmployee = employees[0] as unknown as Record<string, unknown>;
    const subsidiaryFields = [
      'subsidiary',
      'subsidiaryid',
      'subsidiarynohierarchy',
      'subsidiarynohierarchyname',
      'custentity_subsidiary',
      'department',
      'location',
      'class',
    ];

    let hasSubsidiary = false;
    subsidiaryFields.forEach((field) => {
      const value = firstEmployee[field];
      if (value !== undefined && value !== null && value !== '') {
        console.log(`✅ Found: ${field} = ${JSON.stringify(value)}`);
        hasSubsidiary = true;
      } else {
        console.log(`❌ Missing: ${field}`);
      }
    });

    if (!hasSubsidiary) {
      console.log('\n⚠️  No subsidiary fields found in employee data');
      console.log('This might be a permissions issue or employees may not have subsidiaries assigned');
    } else {
      console.log('\n✅ Subsidiary data found for employees!');
    }

    // Check for email field (critical for matching Google auth)
    console.log('\n📧 Email Field Analysis:');
    console.log('='.repeat(60));
    const employeesWithEmail = employees.filter((emp) => emp.email && emp.email.trim() !== '');
    console.log(`Employees with email: ${employeesWithEmail.length} / ${employees.length}`);

    if (employeesWithEmail.length > 0) {
      console.log('\nSample employees with email:');
      employeesWithEmail.slice(0, 3).forEach((emp) => {
        console.log(`  - ${emp.firstname} ${emp.lastname} (${emp.email})`);
      });
    }

    // Test fetching a specific employee by ID
    console.log('\n📋 Testing Single Employee Fetch:');
    console.log('='.repeat(60));

    const testEmployeeId = employees[0].internalId;
    console.log(`Fetching employee ID: ${testEmployeeId}...`);

    const singleEmployee = await netsuiteClient.getEmployeeById(testEmployeeId);

    console.log('\nSingle Employee Response:');
    console.log(JSON.stringify(singleEmployee, null, 2));

    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Total Employees: ${employees.length}`);
    console.log(`Employees with Email: ${employeesWithEmail.length}`);
    console.log(`Subsidiary Fields Found: ${hasSubsidiary ? 'YES ✅' : 'NO ❌'}`);
    console.log('\nAvailable Fields in Employee Object:');
    Object.keys(firstEmployee).forEach((key) => {
      const value = firstEmployee[key];
      const valueType = typeof value;
      const valuePreview = valueType === 'string' && (value as string).length > 50
        ? (value as string).substring(0, 50) + '...'
        : JSON.stringify(value);
      console.log(`  - ${key} (${valueType}): ${valuePreview}`);
    });

    console.log('\n✅ Test completed successfully!');
    console.log('='.repeat(60));

  } catch (error: unknown) {
    console.error('\n❌ Test Failed:');
    console.error('='.repeat(60));
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('\nStack Trace:', error.stack);
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  }
}

// Run test
testNetSuiteEmployees();
