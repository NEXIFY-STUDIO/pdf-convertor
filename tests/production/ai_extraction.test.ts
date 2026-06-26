import { describe, it, expect } from 'vitest';
import { extractFromVUBStatement } from '../../src/lib/mistralClient';
import fs from 'fs';
import path from 'path';

describe('AI Extraction - Production Tests', () => {
  const testFilePath = path.join(__dirname, '../../../tests/fixtures/589815263-inbound2080046449.txt');
  const testData = fs.readFileSync(testFilePath, 'utf8');

  it('should extract exactly 19 transactions', () => {
    const result = extractFromVUBStatement(testData);
    expect(result.transactions.length).toBe(19);
  });

  it('should extract all required fields for each transaction', () => {
    const result = extractFromVUBStatement(testData);
    result.transactions.forEach((tx: any) => {
      expect(tx).toHaveProperty('date_valuta');
      expect(tx).toHaveProperty('amount');
      expect(tx).toHaveProperty('description');
      expect(tx).toHaveProperty('account');
    });
  });

  it('should correctly extract client data', () => {
    const result = extractFromVUBStatement(testData);
    expect(result.client.name).toContain('MONIKA KUPČOVÁ');
    expect(result.client.iban).toBe('SK70 0200 0000 0011 4286 3551');
    expect(result.client.bic).toBe('SUBASKBX');
  });

  it('should correctly extract balances', () => {
    const result = extractFromVUBStatement(testData);
    expect(result.balances.opening_balance).toBe(1708.49);
    expect(result.balances.closing_balance).toBe(1837.22);
    expect(result.balances.total_credit).toBe(716.22);
    expect(result.balances.total_debit).toBe(580.61);
    expect(result.balances.total_fees).toBe(6.88);
  });

  it('should handle diacritics correctly', () => {
    const result = extractFromVUBStatement(testData);
    const hasDiacritics = result.transactions.some((tx: any) =>
      tx.description?.includes('Č') ||
      tx.description?.includes('ľ') ||
      tx.description?.includes('ň') ||
      tx.client?.name?.includes('Č')
    );
    expect(hasDiacritics).toBe(true);
  });
});
