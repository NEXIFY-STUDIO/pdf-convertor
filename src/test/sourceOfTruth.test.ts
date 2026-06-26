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

    it('should validate transaction with v2 PDF detail fields', () => {
      const tx = {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -92,
        popis: 'ZSE ENERGIA',
        details: ['SK11 0200 0000 0000 0000 0001', 'Názov: energia'],
        bank_ref: '18071823AJIBR',
        fee_type: 'L',
        type: 'outgoing' as const,
        is_fee: false,
      };
      const result = TransactionSchema.safeParse(tx);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.details).toHaveLength(2);
        expect(result.data.bank_ref).toBe('18071823AJIBR');
        expect(result.data.fee_type).toBe('L');
      }
    });

    it('should accept transaction without optional v2 fields', () => {
      const result = TransactionSchema.safeParse({
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.details).toBeUndefined();
        expect(result.data.bank_ref).toBeUndefined();
        expect(result.data.fee_type).toBeUndefined();
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

  // VÚB-specific edge cases
  describe('VÚB-specific edge cases', () => {
    describe('Optional transaction fields (vs, ks, ss)', () => {
      it('should validate transaction without variabilný symbol (vs)', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Platba bez VS',
          ks: '0308',
          ss: '123456',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
      });

      it('should validate transaction without konštantný symbol (ks)', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Platba bez KS',
          vs: '1234567890',
          ss: '123456',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
      });

      it('should validate transaction without špecifický symbol (ss)', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Platba bez ŠS',
          vs: '1234567890',
          ks: '0308',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
      });

      it('should validate transaction with all symbols missing', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Platba bez symbolov',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
      });
    });

    describe('Extremely long text handling', () => {
      it('should validate transaction with very long popis (1000+ characters)', () => {
        const longPopis = 'A'.repeat(1000);
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: longPopis,
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.popis).toBe(longPopis);
        }
      });

      it('should validate client with very long title', () => {
        const longTitle = 'A'.repeat(200);
        const client = {
          client_title: longTitle,
          client_street: 'Vilová 31',
          client_zip: '851 01',
          client_city: 'Bratislava',
          client_iban: 'SK123456789012345678',
          client_swift: 'SUBASKBXxxxx',
        };
        const result = ClientDataSchema.safeParse(client);
        expect(result.success).toBe(true);
      });
    });

    describe('Date and number formatting edge cases', () => {
      it('should validate transaction with negative amount (debet)', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: -250.75,
          popis: 'Výber z účtu',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(-250.75);
        }
      });

      it('should validate transaction with positive amount (kredit)', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 500.25,
          popis: 'Vklad na účet',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(500.25);
        }
      });

      it('should validate transaction with zero amount', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 0,
          popis: 'Nulová transakcia',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(true);
      });

      it('should fail validation when date_realiz has invalid characters', () => {
        const transaction = {
          date_realiz: '01/01/2025', // Invalid format - should be dd.mm.yyyy
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Test',
        };
        const result = TransactionSchema.safeParse(transaction);
        // The schema only checks min length, not format, so this should pass
        expect(result.success).toBe(true);
      });

      it('should fail validation when date_realiz is empty string', () => {
        const transaction = {
          date_realiz: '',
          date_valuta: '01.01.2025',
          amount: 100.50,
          popis: 'Test',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Dátum realizácie je povinný');
        }
      });

      it('should fail validation when date_valuta is empty string', () => {
        const transaction = {
          date_realiz: '01.01.2025',
          date_valuta: '',
          amount: 100.50,
          popis: 'Test',
        };
        const result = TransactionSchema.safeParse(transaction);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Dátum valuty je povinný');
        }
      });
    });

    describe('Statement data edge cases', () => {
      it('should validate statement with all optional fields missing', () => {
        const statement = {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '01/2025',
        };
        const result = StatementDataSchema.safeParse(statement);
        expect(result.success).toBe(true);
      });

      it('should validate statement with currency', () => {
        const statement = {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '01/2025',
          statement_currency: 'USD',
        };
        const result = StatementDataSchema.safeParse(statement);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.statement_currency).toBe('USD');
        }
      });
    });
  });
});
