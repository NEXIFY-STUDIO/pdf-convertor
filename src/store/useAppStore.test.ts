import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store pred každým testom
    useAppStore.setState({
      sourceOfTruth: {
        bank: {
          bank_logo_id: 'Test Bank',
          bank_register_info: 'Test Reg Info',
          bank_outlet_id: '12345',
          bank_outlet_address: 'Test Address',
        },
        client: {
          client_title: 'Test Client',
          client_street: 'Test Street',
          client_zip: '12345',
          client_city: 'Test City',
          client_iban: 'SK1234567890',
          client_swift: 'TEST',
          client_account: 'Test Account',
        },
        statement: {
          period_start: '01.01.2025',
          period_end: '31.01.2025',
          statement_number: '1/2025',
          statement_frequency: 'monthly',
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
      }
    });
  });

  it('mal by správne vypočítať celkový kredit, debet a konečný zostatok', () => {
    const store = useAppStore.getState();
    
    store.setOpeningBalance(1000);
    
    store.addTransaction({
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
      amount: 500, // Kredit
      popis: 'Vklad'
    });
    
    store.addTransaction({
      date_realiz: '02.01.2025',
      date_valuta: '02.01.2025',
      amount: -200, // Debet
      popis: 'Výber'
    });

    const updatedBalances = useAppStore.getState().sourceOfTruth.balances;

    expect(updatedBalances.opening_balance).toBe(1000);
    expect(updatedBalances.total_credit).toBe(500);
    expect(updatedBalances.total_debit).toBe(200);
    expect(updatedBalances.closing_balance).toBe(1300); // 1000 + 500 - 200 = 1300
  });

  it('konečný zostatok nesmie byť možné manuálne prepísať mimo prepočtu', () => {
    const store = useAppStore.getState();
    
    store.setTransactions([
      { date_realiz: '01.01.2025', date_valuta: '01.01.2025', amount: 100, popis: 'Test' }
    ]);

    expect(useAppStore.getState().sourceOfTruth.balances.closing_balance).toBe(100);
  });

  it('mal by správne aktualizovať bankové údaje pomocou setBankData', () => {
    const store = useAppStore.getState();
    store.setBankData({
      bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
      bank_outlet_id: '99999',
    });
    expect(useAppStore.getState().sourceOfTruth.bank.bank_logo_id).toBe('VÚB BANKA Intesa Sanpaolo Group');
    expect(useAppStore.getState().sourceOfTruth.bank.bank_outlet_id).toBe('99999');
  });

  it('mal by správne aktualizovať údaje klienta pomocou setClientData', () => {
    const store = useAppStore.getState();
    store.setClientData({
      client_title: 'Updated Client s.r.o.',
      client_id: '12345678',
    });
    expect(useAppStore.getState().sourceOfTruth.client.client_title).toBe('Updated Client s.r.o.');
    expect(useAppStore.getState().sourceOfTruth.client.client_id).toBe('12345678');
  });

  it('mal by správne aktualizovať parametre výpisu pomocou setStatementData', () => {
    const store = useAppStore.getState();
    store.setStatementData({
      statement_number: '12/2025',
      statement_currency: 'USD',
    });
    expect(useAppStore.getState().sourceOfTruth.statement.statement_number).toBe('12/2025');
    expect(useAppStore.getState().sourceOfTruth.statement.statement_currency).toBe('USD');
  });

  it('mal by správne aktualizovať exportSettings pomocou setExportSettings', () => {
    const store = useAppStore.getState();
    store.setExportSettings({
      show_logo: false,
      language: 'en',
    });
    expect(useAppStore.getState().sourceOfTruth.exportSettings.show_logo).toBe(false);
    expect(useAppStore.getState().sourceOfTruth.exportSettings.language).toBe('en');
  });

  // VÚB-specific integration tests
  describe('VÚB-specific integration tests', () => {
    it('mal by správne importovať úplné JSON dáta naraz (bulk import)', () => {
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
          closing_balance: 0,
          total_credit: 0,
          total_debit: 0,
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

      store.setBankData(fullVubData.bank);
      store.setClientData(fullVubData.client);
      store.setStatementData(fullVubData.statement);
      store.setOpeningBalance(fullVubData.balances.opening_balance);
      store.setTransactions(fullVubData.transactions);
      store.setExportSettings(fullVubData.exportSettings);

      const state = useAppStore.getState().sourceOfTruth;
      expect(state.bank.bank_logo_id).toBe('VÚB BANKA Intesa Sanpaolo Group');
      expect(state.client.client_title).toBe('Test Company s.r.o.');
      expect(state.statement.statement_number).toBe('01/2025');
      expect(state.balances.opening_balance).toBe(1000);
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].amount).toBe(500);
    });

    it('mal by správne zmeniť jediný atribút klienta bez poškodenia ostatných VÚB hodnôt', () => {
      const store = useAppStore.getState();
      
      // Nastavíme počiatocné dáta
      store.setClientData({
        client_title: 'Original s.r.o.',
        client_street: 'Original Street',
        client_zip: '851 01',
        client_city: 'Bratislava',
        client_iban: 'SK123456789012345678',
        client_swift: 'SUBASKBX',
        client_id: '12345678',
      });

      // Zmeníme len jeden attribút
      store.setClientData({
        client_title: 'Updated Company s.r.o.',
      });

      const client = useAppStore.getState().sourceOfTruth.client;
      expect(client.client_title).toBe('Updated Company s.r.o.');
      // Ostatné atribúty by mali ostáť neemenené
      expect(client.client_street).toBe('Original Street');
      expect(client.client_zip).toBe('851 01');
      expect(client.client_city).toBe('Bratislava');
      expect(client.client_iban).toBe('SK123456789012345678');
    });

    it('mal by správne zmeniť zostatok klienta bez poškodenia ostatných dát', () => {
      const store = useAppStore.getState();
      
      // Nastavíme počiatocné dáta
      store.setClientData({
        client_title: 'Test Client',
        client_street: 'Test Street',
        client_zip: '851 01',
        client_city: 'Bratislava',
        client_iban: 'SK123456789012345678',
        client_swift: 'SUBASKBX',
        client_limit: '1000,00',
      });

      // Zmeníme len client_limit
      store.setClientData({
        client_limit: '2000,00',
      });

      const client = useAppStore.getState().sourceOfTruth.client;
      expect(client.client_limit).toBe('2000,00');
      // Ostatné atribúty by mali ostáť neemenené
      expect(client.client_title).toBe('Test Client');
      expect(client.client_street).toBe('Test Street');
    });

    it('mal by správne importovať transakcie s VÚB symbolmi', () => {
      const store = useAppStore.getState();
      
      const vubTransactions = [
        {
          date_realiz: '01.01.2025',
          date_valuta: '01.01.2025',
          amount: 1000,
          popis: 'Platba za služby',
          vs: '1234567890',
          ks: '0308',
          ss: '987654',
          account: 'SK987654321098765432',
          type: 'incoming',
        },
        {
          date_realiz: '02.01.2025',
          date_valuta: '02.01.2025',
          amount: -500,
          popis: 'Výber hotovosti',
          vs: '0987654321',
          ks: '0308',
        },
      ];

      store.setTransactions(vubTransactions);

      const transactions = useAppStore.getState().sourceOfTruth.transactions;
      expect(transactions).toHaveLength(2);
      expect(transactions[0].vs).toBe('1234567890');
      expect(transactions[0].ks).toBe('0308');
      expect(transactions[0].ss).toBe('987654');
      expect(transactions[1].vs).toBe('0987654321');
      expect(transactions[1].ks).toBe('0308');
      expect(transactions[1].ss).toBeUndefined();
    });

    it('mal by správne aktualizovať dátumy výpisu', () => {
      const store = useAppStore.getState();
      
      store.setStatementData({
        period_start: '01.01.2025',
        period_end: '31.01.2025',
        statement_number: '01/2025',
        statement_date: '31.01.2025',
        statement_currency: 'EUR',
      });

      // Zmeníme len statement_date
      store.setStatementData({
        statement_date: '01.02.2025',
      });

      const statement = useAppStore.getState().sourceOfTruth.statement;
      expect(statement.statement_date).toBe('01.02.2025');
      // Ostatné by mali ostáť
      expect(statement.period_start).toBe('01.01.2025');
      expect(statement.period_end).toBe('31.01.2025');
      expect(statement.statement_number).toBe('01/2025');
    });
  });
});
