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
});
