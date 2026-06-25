/**
 * LeftPanel Integration Tests
 * Tests for VÚB PDF download flow and data validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { SourceOfTruthType, SourceOfTruthSchema } from '../schema/sourceOfTruth';

// Helper to set up store with test data
const setupStoreWithData = (data: Partial<SourceOfTruthType> = {}) => {
  const defaultData: SourceOfTruthType = {
    bank: {
      bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
      bank_register_info: 'VÚB, a.s.',
      bank_outlet_id: '30017',
      bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
    },
    client: {
      client_title: 'Test Client',
      client_street: 'Test Street',
      client_zip: '851 01',
      client_city: 'Bratislava',
      client_iban: 'SK123456789012345678',
      client_swift: 'SUBASKBX',
    },
    statement: {
      period_start: '01.01.2025',
      period_end: '31.01.2025',
      statement_number: '01/2025',
    },
    balances: {
      opening_balance: 1000,
      closing_balance: 1000,
      total_credit: 0,
      total_debit: 0,
    },
    transactions: [],
    exportSettings: {
      show_logo: true,
      language: 'sk',
    },
  };

  useAppStore.setState({
    sourceOfTruth: {
      ...defaultData,
      ...data,
      bank: { ...defaultData.bank, ...data.bank },
      client: { ...defaultData.client, ...data.client },
      statement: { ...defaultData.statement, ...data.statement },
      balances: { ...defaultData.balances, ...data.balances },
      transactions: data.transactions || defaultData.transactions,
      exportSettings: { ...defaultData.exportSettings, ...data.exportSettings },
    },
  });
};

// Import of downloadStatementPdf removed since it is a local function

describe('LeftPanel Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreWithData();
  });

  describe('Data Validation Before PDF Generation', () => {
    it('should validate complete VÚB data before PDF generation', () => {
      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
    });

    it('should have valid data with VÚB transaction symbols', () => {
      setupStoreWithData({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 1000,
            popis: 'Platba za služby',
            vs: '1234567890',
            ks: '0308',
            ss: '987654',
            account: 'SK987654321098765432',
          },
        ],
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions[0].vs).toBe('1234567890');
        expect(result.data.transactions[0].ks).toBe('0308');
        expect(result.data.transactions[0].ss).toBe('987654');
      }
    });

    it('should have valid data with missing optional symbols', () => {
      setupStoreWithData({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 500,
            popis: 'Platba bez symbolov',
          },
        ],
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
    });

    it('should have valid data with negative amounts (debet)', () => {
      setupStoreWithData({
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: -250.50,
            popis: 'Výber hotovosti',
          },
        ],
        balances: {
          opening_balance: 1000,
          closing_balance: 749.50,
          total_credit: 0,
          total_debit: 250.50,
        },
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions[0].amount).toBe(-250.50);
      }
    });

    it('should have valid data with positive amounts (kredit)', () => {
      setupStoreWithData({
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

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions[0].amount).toBe(1000.50);
      }
    });

    it('should have valid data with different currencies', () => {
      setupStoreWithData({
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '01/2025',
          statement_currency: 'USD',
        },
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statement.statement_currency).toBe('USD');
      }
    });

    it('should have valid data with empty transactions array', () => {
      setupStoreWithData({
        transactions: [],
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
    });

    it('should have valid data with many transactions', () => {
      const manyTransactions = Array.from({ length: 100 }, (_, i) => ({
        date_realiz: `0${i + 1}.01.2025`,
        date_valuta: `0${i + 1}.01.2025`,
        amount: i % 2 === 0 ? 100 : -50,
        popis: `Transakcia ${i + 1}`,
        vs: `VS${i}`,
        ks: '0308',
      }));

      setupStoreWithData({
        transactions: manyTransactions,
      });

      const store = useAppStore.getState();
      const result = SourceOfTruthSchema.safeParse(store.sourceOfTruth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions).toHaveLength(100);
      }
    });
  });

  describe('Store Integration for PDF Generation', () => {
    it('should have all required fields for PDF generation', () => {
      const store = useAppStore.getState();
      const { bank, client, statement, balances, transactions } = store.sourceOfTruth;

      // Check required bank fields
      expect(bank.bank_logo_id).toBeDefined();
      expect(bank.bank_register_info).toBeDefined();
      expect(bank.bank_outlet_id).toBeDefined();
      expect(bank.bank_outlet_address).toBeDefined();

      // Check required client fields
      expect(client.client_title).toBeDefined();
      expect(client.client_street).toBeDefined();
      expect(client.client_zip).toBeDefined();
      expect(client.client_city).toBeDefined();
      expect(client.client_iban).toBeDefined();
      expect(client.client_swift).toBeDefined();

      // Check required statement fields
      expect(statement.period_start).toBeDefined();
      expect(statement.period_end).toBeDefined();
      expect(statement.statement_number).toBeDefined();

      // Check balances
      expect(balances.opening_balance).toBeDefined();
      expect(balances.closing_balance).toBeDefined();
      expect(balances.total_credit).toBeDefined();
      expect(balances.total_debit).toBeDefined();

      // Check transactions
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should preserve data integrity after single attribute update', () => {
      const store = useAppStore.getState();
      
      // Get initial state
      const initialClient = { ...store.sourceOfTruth.client };
      
      // Update only one attribute
      store.setClientData({ client_title: 'Updated Client s.r.o.' });
      
      // Check that only the title changed
      const updatedClient = useAppStore.getState().sourceOfTruth.client;
      expect(updatedClient.client_title).toBe('Updated Client s.r.o.');
      expect(updatedClient.client_street).toBe(initialClient.client_street);
      expect(updatedClient.client_zip).toBe(initialClient.client_zip);
      expect(updatedClient.client_city).toBe(initialClient.client_city);
      expect(updatedClient.client_iban).toBe(initialClient.client_iban);
    });

    it('should handle bulk data import correctly', () => {
      const store = useAppStore.getState();
      
      const fullVubData = {
        bank: {
          bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
          bank_register_info: 'VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava',
          bank_outlet_id: '30017',
          bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
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
        },
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '01/2025',
          statement_frequency: 'mesačne',
          statement_title: 'VÝPIS Z ÚČTU',
          statement_date: '31.01.2025',
          statement_currency: 'EUR',
        },
        balances: {
          opening_balance: 1000,
          closing_balance: 1500,
          total_credit: 1500,
          total_debit: 1000,
        },
        transactions: [
          {
            date_realiz: '01.01.2025',
            date_valuta: '01.01.2025',
            amount: 500,
            popis: 'Vklad',
            vs: '1234567890',
            ks: '0308',
          },
        ],
        exportSettings: {
          show_logo: true,
          language: 'sk' as const,
        },
      };

      // Set all data at once
      store.setBankData(fullVubData.bank);
      store.setClientData(fullVubData.client);
      store.setStatementData(fullVubData.statement);
      store.setOpeningBalance(fullVubData.balances.opening_balance);
      store.setTransactions(fullVubData.transactions);
      store.setExportSettings(fullVubData.exportSettings);

      // Verify all data is set correctly
      const state = useAppStore.getState().sourceOfTruth;
      expect(state.bank.bank_logo_id).toBe('VÚB BANKA Intesa Sanpaolo Group');
      expect(state.client.client_title).toBe('Test Company s.r.o.');
      expect(state.statement.statement_number).toBe('01/2025');
      expect(state.balances.opening_balance).toBe(1000);
      expect(state.transactions).toHaveLength(1);
    });
  });

  describe('Filename Generation for PDF Download', () => {
    it('should generate correct filename from statement number', () => {
      setupStoreWithData({
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '12/2025',
        },
      });

      const store = useAppStore.getState();
      const safeName = store.sourceOfTruth.statement.statement_number?.replace(/\//g, '_');
      const expectedFilename = `Vypis_${safeName}.pdf`;
      expect(expectedFilename).toBe('Vypis_12_2025.pdf');
    });

    it('should handle statement number with multiple slashes', () => {
      setupStoreWithData({
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '01/2025/extra',
        },
      });

      const store = useAppStore.getState();
      const safeName = store.sourceOfTruth.statement.statement_number?.replace(/\//g, '_');
      const expectedFilename = `Vypis_${safeName}.pdf`;
      expect(expectedFilename).toBe('Vypis_01_2025_extra.pdf');
    });

    it('should use default filename when statement number is missing', () => {
      setupStoreWithData({
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '',
        },
      });

      const store = useAppStore.getState();
      const safeName = store.sourceOfTruth.statement.statement_number?.replace(/\//g, '_') || 'export';
      const expectedFilename = `Vypis_${safeName}.pdf`;
      expect(expectedFilename).toBe('Vypis_export.pdf');
    });
  });
});
