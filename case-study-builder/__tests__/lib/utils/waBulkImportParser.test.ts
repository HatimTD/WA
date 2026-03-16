import {
  parseCSV,
  parseExcelData,
  convertToCreateInput,
  generateCSVTemplate,
  type BulkImportRow,
} from '@/lib/utils/waBulkImportParser';

describe('waBulkImportParser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV with all required fields', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,Test Customer,Mining,Sydney,Crusher Hammer,WORKSHOP,ABRASION,Component wears out quickly,Applied hardface overlay,HARDFACE HC-O`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.validRows).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.rows[0]).toMatchObject({
        rowNumber: 2,
        type: 'APPLICATION',
        customerName: 'Test Customer',
        industry: 'Mining',
        location: 'Sydney',
        componentWorkpiece: 'Crusher Hammer',
        workType: 'WORKSHOP',
        wearType: 'ABRASION',
        problemDescription: 'Component wears out quickly',
        waSolution: 'Applied hardface overlay',
        waProduct: 'HARDFACE HC-O',
      });
    });

    it('should return error for missing required fields', () => {
      const csv = `type,customerName,industry
APPLICATION,Test Customer,Mining`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.validRows).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'location')).toBe(true);
      expect(result.errors.some(e => e.field === 'componentWorkpiece')).toBe(true);
    });

    it('should validate enum values', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
INVALID_TYPE,Test Customer,Mining,Sydney,Crusher Hammer,WORKSHOP,ABRASION,Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should validate workType enum', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,Test Customer,Mining,Sydney,Crusher Hammer,INVALID_WORK,ABRASION,Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'workType')).toBe(true);
    });

    it('should handle comma-separated wearType values', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,Test Customer,Mining,Sydney,Crusher Hammer,WORKSHOP,"ABRASION,IMPACT,CORROSION",Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.rows[0].wearType).toBe('ABRASION,IMPACT,CORROSION');
    });

    it('should return error for invalid wearType values', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,Test Customer,Mining,Sydney,Crusher Hammer,WORKSHOP,INVALID_WEAR,Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'wearType')).toBe(true);
    });

    it('should handle empty file', () => {
      const csv = '';
      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('file');
    });

    it('should handle header-only file', () => {
      const csv = `type,customerName,industry`;
      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('header row and at least one data row');
    });

    it('should normalize column names', () => {
      const csv = `Case Type,Customer Name,Industry,Location,Component Workpiece,Work Type,Wear Type,Problem Description,WA Solution,WA Product
APPLICATION,Test Customer,Mining,Sydney,Crusher Hammer,WORKSHOP,ABRASION,Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.rows[0].type).toBe('APPLICATION');
      expect(result.rows[0].customerName).toBe('Test Customer');
    });

    it('should handle quoted values with commas', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,"Customer, Inc.",Mining,Sydney,Crusher Hammer,WORKSHOP,ABRASION,"Problem with, commas",Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.rows[0].customerName).toBe('Customer, Inc.');
      expect(result.rows[0].problemDescription).toBe('Problem with, commas');
    });

    it('should handle escaped quotes', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,"Customer ""Nickname"" Corp",Mining,Sydney,Crusher Hammer,WORKSHOP,ABRASION,Test problem,Test solution,Test product`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.rows[0].customerName).toBe('Customer "Nickname" Corp');
    });

    it('should parse multiple rows', () => {
      const csv = `type,customerName,industry,location,componentWorkpiece,workType,wearType,problemDescription,waSolution,waProduct
APPLICATION,Customer 1,Mining,Sydney,Hammer 1,WORKSHOP,ABRASION,Problem 1,Solution 1,Product 1
TECH,Customer 2,Manufacturing,Melbourne,Hammer 2,ON_SITE,IMPACT,Problem 2,Solution 2,Product 2
STAR,Customer 3,Steel,Perth,Hammer 3,BOTH,CORROSION,Problem 3,Solution 3,Product 3`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.validRows).toBe(3);
      expect(result.rows[0].type).toBe('APPLICATION');
      expect(result.rows[1].type).toBe('TECH');
      expect(result.rows[2].type).toBe('STAR');
    });
  });

  describe('parseExcelData', () => {
    it('should parse valid Excel data array', () => {
      const data = [
        {
          type: 'APPLICATION',
          customerName: 'Test Customer',
          industry: 'Mining',
          location: 'Sydney',
          componentWorkpiece: 'Crusher Hammer',
          workType: 'WORKSHOP',
          wearType: 'ABRASION',
          problemDescription: 'Test problem',
          waSolution: 'Test solution',
          waProduct: 'Test product',
        },
      ];

      const result = parseExcelData(data);

      expect(result.success).toBe(true);
      expect(result.validRows).toBe(1);
      expect(result.rows[0].customerName).toBe('Test Customer');
    });

    it('should handle empty array', () => {
      const result = parseExcelData([]);

      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('file');
    });

    it('should normalize column names from Excel', () => {
      const data = [
        {
          'Case Type': 'APPLICATION',
          'Customer Name': 'Test Customer',
          Industry: 'Mining',
          Location: 'Sydney',
          'Component Workpiece': 'Crusher Hammer',
          'Work Type': 'WORKSHOP',
          'Wear Type': 'ABRASION',
          'Problem Description': 'Test problem',
          'WA Solution': 'Test solution',
          'WA Product': 'Test product',
        },
      ];

      const result = parseExcelData(data);

      expect(result.success).toBe(true);
      expect(result.rows[0].type).toBe('APPLICATION');
      expect(result.rows[0].customerName).toBe('Test Customer');
    });
  });

  describe('convertToCreateInput', () => {
    it('should convert BulkImportRow to create input format', () => {
      const row: BulkImportRow = {
        rowNumber: 2,
        type: 'APPLICATION',
        customerName: 'Test Customer',
        industry: 'Mining',
        location: 'Sydney',
        country: 'Australia',
        componentWorkpiece: 'Crusher Hammer',
        workType: 'WORKSHOP',
        wearType: 'ABRASION,IMPACT',
        baseMetal: 'Steel',
        generalDimensions: '100x50x20mm',
        oem: 'CAT',
        problemDescription: 'Test problem',
        previousSolution: 'Old solution',
        previousServiceLife: '3 months',
        competitorName: 'Competitor Inc',
        waSolution: 'Test solution',
        waProduct: 'Test product',
        technicalAdvantages: 'Better durability',
        expectedServiceLife: '12 months',
        solutionValueRevenue: '50000',
        annualPotentialRevenue: '200000',
        customerSavingsAmount: '30000',
        tags: 'mining,crusher',
      };

      const input = convertToCreateInput(row);

      expect(input.type).toBe('APPLICATION');
      expect(input.status).toBe('DRAFT');
      expect(input.customerName).toBe('Test Customer');
      expect(input.wearType).toEqual(['ABRASION', 'IMPACT']);
      expect(input.tags).toEqual(['mining', 'crusher']);
      expect(input.images).toEqual([]);
      expect(input.supportingDocs).toEqual([]);
    });

    it('should handle missing optional fields', () => {
      const row: BulkImportRow = {
        rowNumber: 2,
        type: 'TECH',
        customerName: 'Test Customer',
        industry: 'Manufacturing',
        location: 'Melbourne',
        componentWorkpiece: 'Roller',
        workType: 'ON_SITE',
        wearType: 'CORROSION',
        problemDescription: 'Corrosion issue',
        waSolution: 'Applied coating',
        waProduct: 'HARDFACE CR',
      };

      const input = convertToCreateInput(row);

      expect(input.type).toBe('TECH');
      expect(input.country).toBe('');
      expect(input.baseMetal).toBe('');
      expect(input.previousSolution).toBe('');
      expect(input.tags).toEqual([]);
    });

    it('should default wearType to ABRASION if empty', () => {
      const row: BulkImportRow = {
        rowNumber: 2,
        type: 'APPLICATION',
        customerName: 'Test Customer',
        industry: 'Mining',
        location: 'Sydney',
        componentWorkpiece: 'Hammer',
        workType: 'WORKSHOP',
        wearType: '',
        problemDescription: 'Test',
        waSolution: 'Test',
        waProduct: 'Test',
      };

      const input = convertToCreateInput(row);

      expect(input.wearType).toEqual(['ABRASION']);
    });
  });

  describe('generateCSVTemplate', () => {
    it('should generate a valid CSV template', () => {
      const template = generateCSVTemplate();

      expect(template).toContain('type,customerName,industry');
      expect(template).toContain('APPLICATION,Example Customer');
      expect(template.split('\n')).toHaveLength(2);
    });

    it('should include all required headers', () => {
      const template = generateCSVTemplate();
      const headers = template.split('\n')[0];

      expect(headers).toContain('type');
      expect(headers).toContain('customerName');
      expect(headers).toContain('industry');
      expect(headers).toContain('location');
      expect(headers).toContain('componentWorkpiece');
      expect(headers).toContain('workType');
      expect(headers).toContain('wearType');
      expect(headers).toContain('problemDescription');
      expect(headers).toContain('waSolution');
      expect(headers).toContain('waProduct');
    });
  });
});
