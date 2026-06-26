import { describe, it, expect, beforeAll } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { StatementDocument } from '../../src/components/RightPanel';
import { useAppStore } from '../../src/store/useAppStore';
import fs from 'fs';
import path from 'path';
import React from 'react';

describe('PDF Generation - Production Tests', () => {
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    const store = useAppStore.getState();
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../../tests/fixtures/ai_extracted_data.json'),
      'utf8'
    ));
    store.setSourceOfTruth(testData);

    const pdfBlob = await pdf(React.createElement(StatementDocument, { sourceOfTruth: store.sourceOfTruth }) as any).toBlob();
    pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
    fs.writeFileSync(path.join(__dirname, '../../../tests/outputs/test_pdf.pdf'), pdfBuffer);
  });

  it('should generate a valid PDF', () => {
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate exactly 4 pages', async () => {
    const { execSync } = require('child_process');
    const pageCount = execSync(
      `.venv/bin/python3 -c "import pdf2image; print(len(pdf2image.convert_from_path('tests/outputs/test_pdf.pdf')))"`,
      { encoding: 'utf8' }
    ).trim();
    expect(parseInt(pageCount)).toBe(4);
  });

  it('should contain all 19 transactions', async () => {
    const { execSync } = require('child_process');
    const text = execSync(`pdftotext -layout tests/outputs/test_pdf.pdf -`, { encoding: 'utf8' });
    const transactionCount = (text.match(/SK[0-9]{2}/g) || []).length;
    expect(transactionCount).toBeGreaterThanOrEqual(19);
  });

  it('should contain diacritics', async () => {
    const { execSync } = require('child_process');
    const text = execSync(`pdftotext -layout tests/outputs/test_pdf.pdf -`, { encoding: 'utf8' });
    expect(text).toContain('KUPČOVÁ');
    expect(text).toContain('ÚČTU');
    expect(text).toContain('KĽAČANY');
  });
});
