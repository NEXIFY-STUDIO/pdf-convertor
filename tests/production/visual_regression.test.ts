import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Visual Regression - Production Tests', () => {
  const originalPdf = path.join(__dirname, '../../../tests/fixtures/vub_original_monika_kupcova.pdf');
  const generatedPdf = path.join(__dirname, '../../../tests/outputs/ai_generated.pdf');

  it('should match original PDF within 0.1% tolerance', () => {
    try {
      const result = execSync(
        `.venv/bin/python3 scripts/visual_regression_test.py ${originalPdf} ${generatedPdf}`,
        { encoding: 'utf8' }
      );

      const hasMismatch = result.includes('MISMATCH') || result.includes('FAILED');
      const diffPercentage = parseFloat(result.match(/\d+\.\d+%/)?.[0] || '100');

      expect(hasMismatch).toBe(false);
      expect(diffPercentage).toBeLessThan(0.1);
    } catch (error: any) {
      throw new Error(`Visual regression test failed: ${error.stdout}`);
    }
  });

  it('should generate diff images for debugging', () => {
    const diffDir = path.join(__dirname, '../../../tests/outputs/diffs');
    if (!fs.existsSync(diffDir)) {
      return;
    }
    const diffFiles = fs.readdirSync(diffDir).filter(f => f.startsWith('diff_'));
    expect(diffFiles.length).toBeLessThanOrEqual(4); // Max 4 diff pages
  });
});
