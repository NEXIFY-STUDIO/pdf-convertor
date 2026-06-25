import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

// Mock react-pdf
vi.mock('@react-pdf/renderer', () => {
  return {
    PDFViewer: ({ children }: any) => <div data-testid="pdf-viewer">{children}</div>,
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
    Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
    View: ({ children }: any) => <div data-testid="pdf-view">{children}</div>,
    StyleSheet: {
      create: (styles: any) => styles,
    },
    Font: {
      register: vi.fn(),
    },
    Image: ({ src }: any) => <img data-testid="pdf-image" src={src} />,
    pdf: () => ({
      toBlob: async () => new Blob(['pdf-content'], { type: 'application/pdf' })
    })
  };
});

// Mock jszip and file-saver
vi.mock('jszip', () => {
  return {
    default: class JSZip {
      file = vi.fn();
      generateAsync = async () => new Blob(['zip-content'], { type: 'application/zip' });
    }
  };
});

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

describe('Batch PDF Generator & Time-Machine Store Logic', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      batchMode: false,
      selectedBatchIndex: 0,
      batchStatements: [],
      batchSettings: {
        startMonth: '11',
        startYear: '2025',
        numberOfMonths: 3,
        initialOpeningBalance: 1000,
        recurringTransactions: [
          { description: 'Salary', amount: 2000, day: 15 },
          { description: 'Rent', amount: -600, day: 2 }
        ]
      }
    });
  });

  it('should generate batch statements with correct carrying balances', () => {
    const store = useAppStore.getState();
    expect(store.batchStatements.length).toBe(0);

    // Trigger generateBatch
    useAppStore.getState().generateBatch();

    const updatedStore = useAppStore.getState();
    expect(updatedStore.batchStatements.length).toBe(3);

    // Month 1 (11/2025)
    // Opening balance: 1000.00
    // Transactions: Salary (+2000), Rent (-600) -> Net: +1400
    // Closing balance: 2400.00
    const m1 = updatedStore.batchStatements[0];
    expect(m1.statement.statement_number).toBe('11/2025');
    expect(m1.balances.opening_balance).toBe(1000);
    expect(m1.balances.closing_balance).toBe(2400);

    // Month 2 (12/2025)
    // Opening balance: 2400.00 (carried over)
    // Transactions: Salary (+2000), Rent (-600) -> Net: +1400
    // Closing balance: 3800.00
    const m2 = updatedStore.batchStatements[1];
    expect(m2.statement.statement_number).toBe('12/2025');
    expect(m2.balances.opening_balance).toBe(2400);
    expect(m2.balances.closing_balance).toBe(3800);

    // Month 3 (01/2026)
    // Opening: 3800.00
    // Closing: 5200.00
    const m3 = updatedStore.batchStatements[2];
    expect(m3.statement.statement_number).toBe('01/2026');
    expect(m3.balances.opening_balance).toBe(3800);
    expect(m3.balances.closing_balance).toBe(5200);
  });

  it('should cascade balances when modifying a month in the middle of a batch', () => {
    // Generate 3 months batch
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    let store = useAppStore.getState();
    expect(store.batchStatements[2].balances.closing_balance).toBe(5200);

    // Select Month 1 (index 0) and edit/add a transaction of -500
    useAppStore.getState().setSelectedBatchIndex(0);
    const m1Transactions = [...useAppStore.getState().sourceOfTruth.transactions];
    m1Transactions.push({
      date_realiz: '10.11.2025',
      date_valuta: '10.11.2025',
      amount: -500,
      popis: 'Extra shopping',
      account: '',
      vs: '',
      ks: '',
      ss: '',
      type: 'outgoing'
    });
    
    // This will trigger recalculation and cascading
    useAppStore.getState().setTransactions(m1Transactions);

    store = useAppStore.getState();
    // Month 1 closing balance should be 2400 - 500 = 1900
    expect(store.batchStatements[0].balances.closing_balance).toBe(1900);
    // Month 2 opening balance should cascade to 1900
    expect(store.batchStatements[1].balances.opening_balance).toBe(1900);
    // Month 2 closing balance: 1900 + 1400 = 3300
    expect(store.batchStatements[1].balances.closing_balance).toBe(3300);
    // Month 3 closing balance: 3300 + 1400 = 4700
    expect(store.batchStatements[2].balances.closing_balance).toBe(4700);
  });
});
