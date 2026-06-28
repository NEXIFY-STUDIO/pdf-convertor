import { describe, it, expect } from 'vitest';
import { SourceOfTruthSchema } from '../../src/schema/sourceOfTruth';
import fs from 'fs';
import path from 'path';

describe('Data Validation - Production Tests', () => {
  it('should validate AI extracted data against schema', () => {
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/outputs/ai_extracted_data.json'),
      'utf8'
    ));

    const result = SourceOfTruthSchema.safeParse(testData);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error('Validation errors:', result.error.format());
    }
  });

  it('should have all required fields', () => {
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/outputs/ai_extracted_data.json'),
      'utf8'
    ));

    expect(testData).toHaveProperty('statement');
    expect(testData).toHaveProperty('client');
    expect(testData).toHaveProperty('bank');
    expect(testData).toHaveProperty('balances');
    expect(testData).toHaveProperty('transactions');
  });

  it('should have correct data types', () => {
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/outputs/ai_extracted_data.json'),
      'utf8'
    ));

    expect(typeof testData.balances.opening_balance).toBe('number');
    expect(typeof testData.transactions[0].amount).toBe('number');
    expect(typeof testData.client.name).toBe('string');
  });
});
