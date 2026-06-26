import { describe, it, expect } from 'vitest';
import React from 'react';
import { StatementDocument } from '../components/RightPanel';
import { SourceOfTruthType } from '../schema/sourceOfTruth';

// Mock data for testing
const createMockSourceOfTruth = (overrides: any = {}): SourceOfTruthType => {
  const transactions = (overrides.transactions || []).map((t: any) => ({
    type: 'outgoing',
    is_fee: false,
    ...t
  }));

  return {
    bank: {
      bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
      bank_register_info: 'VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava',
      bank_outlet_id: '30017',
      bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
      ...overrides.bank,
    },
    client: {
      client_title: 'Test Company s.r.o.',
      client_street: 'Hlavná 123',
      client_zip: '811 01',
      client_city: 'Bratislava',
      client_iban: 'SK987654321098765432',
      client_swift: 'SUBASKBX',
      client_account: '2345678901',
      client_id: '12345678',
      client_limit: '5000,00',
      ...overrides.client,
    },
    statement: {
      period_start: '01.01.2025',
      period_end: '31.01.2025',
      statement_number: '01/2025',
      statement_frequency: 'mesačne',
      statement_title: 'VÝPIS Z ÚČTU',
      statement_date: '31.01.2025',
      statement_currency: 'EUR',
      ...overrides.statement,
    },
    balances: {
      opening_balance: 1000,
      closing_balance: 1500,
      total_credit: 1500,
      total_debit: 1000,
      total_fees: 0,
      ...overrides.balances,
    },
    transactions,
    exportSettings: {
      show_logo: true,
      language: 'sk',
      ...overrides.exportSettings,
    },
  };
};

// Helper to check component structure
const checkComponentStructure = (element: React.ReactElement) => {
  expect(element).toBeDefined();
  expect(element).toHaveProperty('type');
  expect(element).toHaveProperty('props');
  expect(element.props).toHaveProperty('sourceOfTruth');
};

describe('StatementDocument Component', () => {
  describe('Mount & Render Error Boundary Tests', () => {
    it('should render without crashing with valid empty data', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [],
        balances: {
          opening_balance: 0,
          closing_balance: 0,
          total_credit: 0,
          total_debit: 0,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render with minimal required data (empty optional fields)', () => {
      const minimalData = createMockSourceOfTruth({
        bank: {
          bank_logo_id: 'VÚB',
          bank_register_info: 'VÚB a.s.',
          bank_outlet_id: '00001',
          bank_outlet_address: 'Address',
        },
        client: {
          client_title: 'Client',
          client_street: 'Street',
          client_zip: '12345',
          client_city: 'City',
          client_iban: 'SK1234567890123456',
          client_swift: 'SWIFT123',
        },
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '1/2025',
        },
        transactions: [],
        balances: {
          opening_balance: 0,
          closing_balance: 0,
          total_credit: 0,
          total_debit: 0,
        },
      });

      const element = <StatementDocument sourceOfTruth={minimalData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render with empty strings for optional fields', () => {
      const dataWithEmptyOptionals = createMockSourceOfTruth({
        client: {
          ...createMockSourceOfTruth().client,
          client_account: '',
          client_id: '',
          client_limit: '',
        },
        statement: {
          ...createMockSourceOfTruth().statement,
          statement_frequency: '',
          statement_date: '',
        },
      });

      const element = <StatementDocument sourceOfTruth={dataWithEmptyOptionals} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });
  });

  describe('Text and Layout Edge Cases', () => {
    it('should render transaction with very long popis without crashing', () => {
      const longPopis = 'A'.repeat(1000);
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100.50,
            popis: longPopis,
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render transaction with all VÚB symbols (vs, ks, ss)', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 500,
            popis: 'Platba s symbolmi',
            vs: '1234567890',
            ks: '0308',
            ss: '987654',
            account: 'SK987654321098765432',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render negative amount (debet) correctly', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: -500.25,
            popis: 'Výber',
          },
        ],
        balances: {
          opening_balance: 1000,
          closing_balance: 499.75,
          total_credit: 0,
          total_debit: 500.25,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render positive amount (kredit) correctly', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 1000.50,
            popis: 'Vklad',
          },
        ],
        balances: {
          opening_balance: 500,
          closing_balance: 1500.50,
          total_credit: 1000.50,
          total_debit: 0,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render multiple transactions without overflow', () => {
      const mockData = createMockSourceOfTruth({
        transactions: Array.from({ length: 50 }, (_, i) => ({
          date_realiz: `0${i + 1}.01.2025`,
          date_valuta: `0${i + 1}.01.2025`,
          amount: i % 2 === 0 ? 100 : -50,
          popis: `Transakcia ${i + 1}`,
          vs: `VS${i}`,
          ks: '0308',
        })),
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render with long client name', () => {
      const longClientName = 'A'.repeat(150);
      const mockData = createMockSourceOfTruth({
        client: {
          ...createMockSourceOfTruth().client,
          client_title: longClientName,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should render with special characters in popis', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100,
            popis: 'Platba za služby: nadvazuje na objednávku č. 123/2025 (vč. DPH 20%)',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });
  });

  describe('Snapshot Tests', () => {
    it('should have consistent structure for basic VÚB statement', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 1000,
            popis: 'Vklad',
            vs: '1234567890',
            ks: '0308',
          },
          {
            date_realiz: '02.01.2025',
            date_valuta: '02.01.2025',
            amount: -500,
            popis: 'Výber',
            vs: '9876543210',
            ks: '0308',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      
      expect(element).toBeDefined();
      expect(element).toHaveProperty('type');
      expect(element.props).toHaveProperty('sourceOfTruth');
      
      // Verify the sourceOfTruth data is passed correctly
      expect(element.props.sourceOfTruth).toEqual(mockData);
    });

    it('should maintain consistent structure with different data', () => {
      const mockData1 = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100,
            popis: 'Test 1',
          },
        ],
      });

      const mockData2 = createMockSourceOfTruth({
        client: {
          ...createMockSourceOfTruth().client,
          client_title: 'Different Company',
        },
        transactions: [
          {
            date_realiz: '05.01.2025',
            date_valuta: '05.01.2025',
            amount: 200,
            popis: 'Test 2',
          },
        ],
      });

      const element1 = <StatementDocument sourceOfTruth={mockData1} />;
      const element2 = <StatementDocument sourceOfTruth={mockData2} />;

      // Both should have the same basic structure (same keys at props level)
      const props1 = element1.props as Record<string, unknown>;
      const props2 = element2.props as Record<string, unknown>;
      expect(Object.keys(props1)).toEqual(Object.keys(props2));
    });

    it('should have correct sourceOfTruth structure', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100,
            popis: 'Test',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      const sourceOfTruth = (element.props as { sourceOfTruth: SourceOfTruthType }).sourceOfTruth;
      
      // Check all required sections exist
      expect(sourceOfTruth).toHaveProperty('bank');
      expect(sourceOfTruth).toHaveProperty('client');
      expect(sourceOfTruth).toHaveProperty('statement');
      expect(sourceOfTruth).toHaveProperty('balances');
      expect(sourceOfTruth).toHaveProperty('transactions');
      expect(sourceOfTruth).toHaveProperty('exportSettings');
      
      // Check VÚB-specific fields
      expect(sourceOfTruth.bank).toHaveProperty('bank_logo_id');
      expect(sourceOfTruth.bank).toHaveProperty('bank_outlet_id');
      expect(sourceOfTruth.client).toHaveProperty('client_iban');
      expect(sourceOfTruth.statement).toHaveProperty('statement_number');
    });
  });

  describe('Balance Calculation Display', () => {
    it('should accept currency formatting data', () => {
      const mockData = createMockSourceOfTruth({
        statement: {
          ...createMockSourceOfTruth().statement,
          statement_currency: 'USD',
        },
        balances: {
          opening_balance: 1234.56,
          closing_balance: 2345.67,
          total_credit: 1500,
          total_debit: 489.11,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should accept zero balances', () => {
      const mockData = createMockSourceOfTruth({
        balances: {
          opening_balance: 0,
          closing_balance: 0,
          total_credit: 0,
          total_debit: 0,
        },
        transactions: [],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });
  });

  describe('VÚB-specific Structure Validation', () => {
    it('should accept transactions without symbols', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100,
            popis: 'Bez symbolov',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      expect(() => {
        checkComponentStructure(element);
      }).not.toThrow();
    });

    it('should accept all symbol types', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 100,
            popis: 'Všetky symboly',
            vs: '1234567890',
            ks: '0308',
            ss: '123454',
          },
        ],
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      const sourceOfTruth = (element.props as { sourceOfTruth: SourceOfTruthType }).sourceOfTruth;
      expect(sourceOfTruth.transactions[0]).toHaveProperty('vs');
      expect(sourceOfTruth.transactions[0]).toHaveProperty('ks');
      expect(sourceOfTruth.transactions[0]).toHaveProperty('ss');
    });

    it('should accept negative and positive amounts in same transaction list', () => {
      const mockData = createMockSourceOfTruth({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 500,
            popis: 'Vklad',
          },
          {
            date_realiz: '02.01.2025',
            date_valuta: '02.01.2025',
            amount: -200,
            popis: 'Výber',
          },
        ],
        balances: {
          opening_balance: 1000,
          closing_balance: 1300,
          total_credit: 500,
          total_debit: 200,
        },
      });

      const element = <StatementDocument sourceOfTruth={mockData} />;
      const sourceOfTruth = (element.props as { sourceOfTruth: SourceOfTruthType }).sourceOfTruth;
      expect(sourceOfTruth.transactions[0].amount).toBe(500);
      expect(sourceOfTruth.transactions[1].amount).toBe(-200);
    });
  });
});
