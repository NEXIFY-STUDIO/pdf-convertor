import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SourceOfTruthType } from '../schema/sourceOfTruth';

const mockToBlob = vi.fn().mockResolvedValue(new Blob(['pdf-content']));
const mockPdf = vi.fn(() => ({ toBlob: mockToBlob }));
const mockZipFile = vi.fn();
const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(['zip-content']));
const mockSaveAs = vi.fn();

vi.mock('../pdf/StatementDocument', () => ({
  StatementDocument: () => null,
}));

vi.mock('@react-pdf/renderer', () => ({
  pdf: (...args: unknown[]) => mockPdf(...args),
}));

vi.mock('jszip', () => ({
  default: vi.fn(() => ({
    file: mockZipFile,
    generateAsync: mockGenerateAsync,
  })),
}));

vi.mock('file-saver', () => ({
  saveAs: (...args: unknown[]) => mockSaveAs(...args),
}));

import { checkMemoryBeforeExport, downloadStatementsZip } from '../export/zipExport';

const makeStatement = (num: string): SourceOfTruthType => ({
  bank: {
    bank_logo_id: 'VÚB',
    bank_register_info: 'reg',
    bank_outlet_id: '1',
    bank_outlet_address: 'addr',
  },
  client: {
    client_title: 'Test',
    client_street: 'St',
    client_zip: '85101',
    client_city: 'BA',
    client_iban: 'SK123456789012345678',
    client_swift: 'SUBASKBX',
  },
  statement: {
    period_start: '01.01.2025',
    period_end: '31.01.2025',
    statement_number: num,
  },
  balances: {
    opening_balance: 0,
    closing_balance: 0,
    total_credit: 0,
    total_debit: 0,
    total_fees: 0,
  },
  transactions: [],
  exportSettings: { show_logo: true, language: 'sk' },
});

describe('zipExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  describe('checkMemoryBeforeExport', () => {
    it('should return true for small batches', () => {
      expect(checkMemoryBeforeExport(3)).toBe(true);
    });

    it('should require confirm for batches over 24 months', () => {
      const confirm = vi.fn().mockReturnValue(false);
      vi.stubGlobal('confirm', confirm);
      expect(checkMemoryBeforeExport(30)).toBe(false);
      expect(confirm).toHaveBeenCalled();
    });

    it('should proceed when user confirms large batch', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      expect(checkMemoryBeforeExport(30)).toBe(true);
    });

    it('should block export when estimated memory exceeds 70% heap', () => {
      const alert = vi.fn();
      vi.stubGlobal('alert', alert);
      Object.defineProperty(window.performance, 'memory', {
        configurable: true,
        value: { jsHeapSizeLimit: 10 * 1024 * 1024 },
      });
      expect(checkMemoryBeforeExport(100)).toBe(false);
      expect(alert).toHaveBeenCalled();
    });
  });

  describe('downloadStatementsZip', () => {
    it('should no-op on empty array', async () => {
      await downloadStatementsZip([]);
      expect(mockPdf).not.toHaveBeenCalled();
      expect(mockSaveAs).not.toHaveBeenCalled();
    });

    it('should generate PDFs in batches and save ZIP', async () => {
      const progress: string[] = [];
      const statements = [makeStatement('01/2025'), makeStatement('02/2025'), makeStatement('03/2025'), makeStatement('04/2025')];

      await downloadStatementsZip(statements, (msg) => progress.push(msg));

      expect(mockPdf).toHaveBeenCalledTimes(4);
      expect(mockZipFile).toHaveBeenCalledTimes(4);
      expect(mockGenerateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'blob', streamFiles: true }),
      );
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.anything(),
        'VUB_Vypisy_Batch_4_mesiacov.zip',
      );
      expect(progress).toContain('Generujem 1/4');
      expect(progress).toContain('Komprimujem...');
    });

    it('should sanitize statement number in filename', async () => {
      await downloadStatementsZip([makeStatement('11/2025')]);
      expect(mockZipFile).toHaveBeenCalledWith(
        'Vypis_11_2025.pdf',
        expect.anything(),
        { binary: true },
      );
    });

    it('should use fallback filename when statement_number missing', async () => {
      const stmt = makeStatement('');
      stmt.statement.statement_number = '';
      await downloadStatementsZip([stmt]);
      expect(mockZipFile).toHaveBeenCalledWith(
        'Vypis_vypis_1.pdf',
        expect.anything(),
        { binary: true },
      );
    });
  });
});

describe('checkMemoryBeforeExport without window', () => {
  it('should return true in non-browser environment', async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    vi.resetModules();
    const { checkMemoryBeforeExport: check } = await import('../export/zipExport');
    expect(check(10)).toBe(true);
    globalThis.window = originalWindow;
  });
});