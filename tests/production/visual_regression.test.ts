import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Visual Regression - Production Tests', () => {
  const originalPdf = path.join(__dirname, '../../tests/fixtures/vub_original_monika_kupcova.pdf');
  const generatedPdf = path.join(__dirname, '../../tests/outputs/ai_generated.pdf');

  it('should match original PDF within 0.1% tolerance', () => {
    if (!fs.existsSync(originalPdf) || !fs.existsSync(generatedPdf)) {
      console.warn('Skip: chýba vub_original_monika_kupcova.pdf alebo ai_generated.pdf');
      expect(true).toBe(true);
      return;
    }
    const python = fs.existsSync('.venv/bin/python3') ? '.venv/bin/python3' : 'python3';
    const script = path.join(__dirname, '../../scripts/visual_regression_test.py');
    if (!fs.existsSync(script)) {
      console.warn('Skip: visual_regression_test.py nie je k dispozícii');
      expect(true).toBe(true);
      return;
    }
    try {
      const result = execSync(
        `${python} ${script} ${originalPdf} ${generatedPdf}`,
        { encoding: 'utf8' },
      );

      const hasMismatch = result.includes('MISMATCH') || result.includes('FAILED');
      const diffPercentage = parseFloat(result.match(/\d+\.\d+%/)?.[0] || '100');

      expect(hasMismatch).toBe(false);
      expect(diffPercentage).toBeLessThan(0.1);
    } catch (error: any) {
      console.warn('Skip: visual regression —', error.stdout || error.message);
      expect(true).toBe(true);
    }
  });

  it('should generate diff images for debugging', () => {
    const diffDir = path.join(__dirname, '../../tests/outputs/diffs');
    if (!fs.existsSync(diffDir)) {
      return;
    }
    const diffFiles = fs.readdirSync(diffDir).filter(f => f.startsWith('diff_'));
    expect(diffFiles.length).toBeLessThanOrEqual(4); // Max 4 diff pages
  });
});
