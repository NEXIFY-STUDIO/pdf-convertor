import { create } from 'zustand';
import { SourceOfTruthType, TransactionType, ClientDataType, StatementDataType, BankDataType, ExportSettingsType } from '../schema/sourceOfTruth';

interface AppState {
  sourceOfTruth: SourceOfTruthType;
  mistralApiKey: string;
  
  // Actions
  setBankData: (data: Partial<BankDataType>) => void;
  setClientData: (data: Partial<ClientDataType>) => void;
  setStatementData: (data: Partial<StatementDataType>) => void;
  setExportSettings: (data: Partial<ExportSettingsType>) => void;
  setOpeningBalance: (balance: number) => void;
  setTransactions: (transactions: TransactionType[]) => void;
  addTransaction: (transaction: TransactionType) => void;
  recalculateBalances: () => void;
  setMistralApiKey: (key: string) => void;
}

const initialSourceOfTruth: SourceOfTruthType = {
  bank: {
    bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
    bank_register_info: 'VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava 25, Obch. reg.: Mestský súd Bratislava III, Oddiel: Sa, Vložka č. 341/B, IČO: 31320155, www.vub.sk',
    bank_outlet_id: '30017',
    bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
  },
  client: {
    client_title: '*GIGASTARS, S.R.O.',
    client_street: 'VILOVÁ 31',
    client_zip: '851 01',
    client_city: 'BRATISLAVA-PETRŽALKA',
    client_iban: 'SK84 0200 0000 0040 7755 7753',
    client_swift: 'SUBASKBX',
    client_account: 'VÚB Biznis účet Štandard',
    client_id: '36821608',
    client_limit: '0,00',
  },
  statement: {
    period_start: '01.11.2025',
    period_end: '30.11.2025',
    statement_number: '11/2025',
    statement_frequency: 'mesačne',
    statement_title: 'VÝPIS Z ÚČTU',
    statement_date: '30.11.2025',
    statement_currency: 'EUR',
    statement_month: '11',
    statement_year: '2025',
    statement_cur_page: '1',
    statement_all_pages: '1',
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

export const useAppStore = create<AppState>((set, get) => ({
  sourceOfTruth: initialSourceOfTruth,
  mistralApiKey: typeof window !== 'undefined' 
    ? localStorage.getItem('mistral_api_key') || (import.meta.env.VITE_MISTRAL_API_KEY as string) || '' 
    : '',
  
  setBankData: (data) => set((state) => ({
    sourceOfTruth: {
      ...state.sourceOfTruth,
      bank: { ...state.sourceOfTruth.bank, ...data }
    }
  })),

  setClientData: (data) => set((state) => ({
    sourceOfTruth: {
      ...state.sourceOfTruth,
      client: { ...state.sourceOfTruth.client, ...data }
    }
  })),

  setStatementData: (data) => set((state) => ({
    sourceOfTruth: {
      ...state.sourceOfTruth,
      statement: { ...state.sourceOfTruth.statement, ...data }
    }
  })),

  setExportSettings: (data) => set((state) => ({
    sourceOfTruth: {
      ...state.sourceOfTruth,
      exportSettings: { ...state.sourceOfTruth.exportSettings, ...data }
    }
  })),

  setOpeningBalance: (balance) => {
    set((state) => ({
      sourceOfTruth: {
        ...state.sourceOfTruth,
        balances: { ...state.sourceOfTruth.balances, opening_balance: balance }
      }
    }));
    get().recalculateBalances();
  },

  setTransactions: (transactions) => {
    set((state) => ({
      sourceOfTruth: { ...state.sourceOfTruth, transactions }
    }));
    get().recalculateBalances();
  },

  addTransaction: (transaction) => {
    set((state) => ({
      sourceOfTruth: {
        ...state.sourceOfTruth,
        transactions: [...state.sourceOfTruth.transactions, transaction]
      }
    }));
    get().recalculateBalances();
  },

  recalculateBalances: () => {
    set((state) => {
      const { opening_balance } = state.sourceOfTruth.balances;
      const { transactions } = state.sourceOfTruth;
      
      let total_credit = 0;
      let total_debit = 0;

      transactions.forEach(t => {
        if (t.amount >= 0) {
          total_credit += t.amount;
        } else {
          total_debit += Math.abs(t.amount);
        }
      });

      const closing_balance = opening_balance + total_credit - total_debit;

      return {
        sourceOfTruth: {
          ...state.sourceOfTruth,
          balances: {
            opening_balance,
            total_credit,
            total_debit,
            closing_balance,
          }
        }
      };
    });
  },

  setMistralApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mistral_api_key', key);
    }
    set({ mistralApiKey: key });
  }
}));
