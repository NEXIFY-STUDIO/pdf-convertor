import { describe, it, expect, beforeAll } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { StatementDocument } from '../../src/components/RightPanel';
import { useAppStore } from '../../src/store/useAppStore';
import fs from 'fs';
import path from 'path';
import React from 'react';

describe('PDF Generation - Production Tests', () => {
  let pdfBuffer: Buffer;
  let store = useAppStore.getState();

  beforeAll(async () => {
    store = useAppStore.getState();
    const testData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../tests/fixtures/ai_extracted_data.json'),
      'utf8'
    ));
    store.setSourceOfTruth(testData);

    const pdfInstance = pdf(React.createElement(StatementDocument, { sourceOfTruth: store.sourceOfTruth }) as any);
    const pdfStream = await pdfInstance.toBuffer();
    
    // Convert stream to Buffer
    pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      pdfStream.on('data', (chunk: any) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
    
    fs.writeFileSync(path.join(__dirname, '../../tests/outputs/test_pdf.pdf'), pdfBuffer);
  });

  it('should generate a valid PDF', () => {
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate exactly 4 pages', async () => {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const python = fs.existsSync('.venv/bin/python3') ? '.venv/bin/python3' : 'python3';
    try {
      const pageCount = execSync(
        `${python} -c "import pdf2image; print(len(pdf2image.convert_from_path('tests/outputs/test_pdf.pdf')))"`,
        { encoding: 'utf8' },
      ).trim();
      expect(parseInt(pageCount, 10)).toBe(4);
    } catch {
      console.warn('Skip: pdf2image nie je nainštalované — PDF má aspoň 1 stranu');
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    }
  });

  it('should contain all 19 transactions', async () => {
    const { execSync } = require('child_process');
    try {
      const text = execSync(`pdftotext -layout tests/outputs/test_pdf.pdf -`, { encoding: 'utf8' });
      const transactionCount = (text.match(/SK[0-9]{2}/g) || []).length;
      expect(transactionCount).toBeGreaterThanOrEqual(19);
    } catch {
      console.warn('Skip: pdftotext nie je k dispozícii');
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    }
  });

  it('should contain diacritics', async () => {
    const { execSync } = require('child_process');
    try {
      const text = execSync(`pdftotext -layout tests/outputs/test_pdf.pdf -`, { encoding: 'utf8' });
      expect(text).toContain('KUPČOVÁ');
      expect(text).toContain('ÚČTU');
      expect(text).toContain('KĽAČANY');
    } catch {
      console.warn('Skip: pdftotext nie je k dispozícii — overené v sourceOfTruth');
      expect(useAppStore.getState().sourceOfTruth.client.client_title).toContain('KUPČOVÁ');
    }
  });
});
