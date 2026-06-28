import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { extractFromVUBStatement } from '../../src/lib/mistralClient';
import { pdf } from '@react-pdf/renderer';
import { StatementDocument } from '../../src/components/RightPanel';
import { useAppStore } from '../../src/store/useAppStore';
import fs from 'fs';
import path from 'path';
import React from 'react';

describe('Performance - Production Tests', () => {
  it('should extract 19 transactions in under 1 second', () => {
    const testData = fs.readFileSync(
      path.join(__dirname, '../../../tests/fixtures/589815263-inbound2080046449.txt'),
      'utf8'
    );

    const start = performance.now();
    extractFromVUBStatement(testData);
    const end = performance.now();

    expect(end - start).toBeLessThan(1000); // < 1s
  });

  it('should generate PDF in under 2 seconds', async () => {
    const store = useAppStore.getState();
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/outputs/ai_extracted_data.json'),
      'utf8'
    ));
    store.setSourceOfTruth(testData);

    const start = performance.now();
    await pdf(React.createElement(StatementDocument, { sourceOfTruth: store.sourceOfTruth }) as any).toBlob();
    const end = performance.now();

    expect(end - start).toBeLessThan(2000); // < 2s
  });

  it('should handle 100 transactions without memory issues', async () => {
    const store = useAppStore.getState();
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/outputs/ai_extracted_data.json'),
      'utf8'
    ));

    // Create 100 transactions
    const manyTransactions = Array(100).fill(null).map((_, i) => ({
      ...testData.transactions[0],
      id: `tx-${i}`,
      amount: i % 2 === 0 ? 100 : -50
    }));

    testData.transactions = manyTransactions;
    store.setSourceOfTruth(testData);

    const start = performance.now();
    await pdf(React.createElement(StatementDocument, { sourceOfTruth: store.sourceOfTruth }) as any).toBlob();
    const end = performance.now();

    expect(end - start).toBeLessThan(5000); // < 5s
  });
});
