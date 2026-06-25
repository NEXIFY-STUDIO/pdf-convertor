import { describe, it, expect } from 'vitest';
import { ClientDataSchema, TransactionSchema, BankDataSchema, StatementDataSchema, BalancesSchema, ExportSettingsSchema, SourceOfTruthSchema } from '../schema/sourceOfTruth';

describe('Source of Truth Schema Validation', () => {
  describe('ClientDataSchema', () => {
    it('should validate correct client data', () => {
      const validClient = {
        client_title: 'GIGASTARS, s.r.o.',
        client_street: 'Vilová 31',
        client_zip: '851 01',
        client_city: 'Bratislava',
        client_iban: 'SK123456789012345678',
        client_swift: 'SUBASKBXxxxx',
        client_id: '36821608',
        client_limit: '0,00',
      };
      const result = ClientDataSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it('should fail validation when client name is missing', () => {
      const invalidClient = {
        client_title: '',
        client_street: 'Vilová 31',
        client_zip: '851 01',
        client_city: 'Bratislava',
        client_iban: 'SK123456789012345678',
        client_swift: 'SUBASKBXxxxx',
      };
      const result = ClientDataSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Názov klienta je povinný');
      }
    });

    it('should fail validation when IBAN is too short', () => {
      const invalidClient = {
        client_title: 'GIGASTARS, s.r.o.',
        client_street: 'Vilová 31',
        client_zip: '851 01',
        client_city: 'Bratislava',
        client_iban: 'SK123',
        client_swift: 'SUBASKBXxxxx',
      };
      const result = ClientDataSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Zadajte platný IBAN');
      }
    });
  });

  describe('TransactionSchema', () => {
    it('should validate correct transaction data', () => {
      const validTransaction = {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 250.50,
        popis: 'Payment for services',
      };
      const result = TransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should fail when date_realiz is missing', () => {
      const invalidTransaction = {
        date_realiz: '',
        date_valuta: '01.01.2025',
        amount: 250.50,
        popis: 'Payment for services',
      };
      const result = TransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Dátum realizácie je povinný');
      }
    });
  });

  describe('BankDataSchema', () => {
    it('should validate correct bank data', () => {
      const validBank = {
        bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
        bank_register_info: 'VÚB, a.s., Mlynské nivy 1...',
        bank_outlet_id: '30017',
        bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
      };
      const result = BankDataSchema.safeParse(validBank);
      expect(result.success).toBe(true);
    });

    it('should fail validation when bank logo ID is missing', () => {
      const invalidBank = {
        bank_logo_id: '',
        bank_register_info: 'VÚB, a.s.',
        bank_outlet_id: '30017',
        bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
      };
      const result = BankDataSchema.safeParse(invalidBank);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Bank logo ID je povinné');
      }
    });

    it('should fail validation when bank register info is missing', () => {
      const invalidBank = {
        bank_logo_id: 'VÚB BANKA',
        bank_register_info: '',
        bank_outlet_id: '30017',
        bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
      };
      const result = BankDataSchema.safeParse(invalidBank);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Registračné info je povinné');
      }
    });
  });

  describe('StatementDataSchema', () => {
    it('should validate correct statement data', () => {
      const validStatement = {
        period_start: '01.11.2025',
        period_end: '30.11.2025',
        statement_number: '11/2025',
        statement_frequency: 'mesačne',
        statement_title: 'VÝPIS Z ÚČTU',
        statement_date: '30.11.2025',
        statement_currency: 'EUR',
      };
      const result = StatementDataSchema.safeParse(validStatement);
      expect(result.success).toBe(true);
    });

    it('should fail validation when period_start is missing', () => {
      const invalidStatement = {
        period_start: '',
        period_end: '30.11.2025',
        statement_number: '11/2025',
      };
      const result = StatementDataSchema.safeParse(invalidStatement);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Začiatok obdobia je povinný');
      }
    });
  });

  describe('BalancesSchema', () => {
    it('should validate correct balances data', () => {
      const validBalances = {
        opening_balance: 100.50,
        closing_balance: 200.50,
        total_credit: 150.00,
        total_debit: 50.00,
      };
      const result = BalancesSchema.safeParse(validBalances);
      expect(result.success).toBe(true);
    });
  });

  describe('ExportSettingsSchema', () => {
    it('should validate correct export settings', () => {
      const validSettings = {
        show_logo: true,
        language: 'sk',
      };
      const result = ExportSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should fall back to defaults when empty', () => {
      const result = ExportSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.show_logo).toBe(true);
        expect(result.data.language).toBe('sk');
      }
    });
  });

  describe('SourceOfTruthSchema', () => {
    it('should validate the complete integrated state', () => {
      const completeData = {
        bank: {
          bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
          bank_register_info: 'VÚB, a.s., Mlynské nivy 1...',
          bank_outlet_id: '30017',
          bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
        },
        client: {
          client_title: 'GIGASTARS, s.r.o.',
          client_street: 'Vilová 31',
          client_zip: '851 01',
          client_city: 'Bratislava',
          client_iban: 'SK123456789012345678',
          client_swift: 'SUBASKBXxxxx',
        },
        statement: {
          period_start: '01.11.2025',
          period_end: '30.11.2025',
          statement_number: '11/2025',
        },
        balances: {
          opening_balance: 0,
          closing_balance: 0,
          total_credit: 0,
          total_debit: 0,
        },
        transactions: [],
        exportSettings: {
          show_logo: true,
          language: 'sk',
        }
      };
      const result = SourceOfTruthSchema.safeParse(completeData);
      expect(result.success).toBe(true);
    });
  });
});
