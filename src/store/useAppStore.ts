import { createWithEqualityFn } from 'zustand/traditional';
import { SourceOfTruthType, TransactionType, ClientDataType, StatementDataType, BankDataType, ExportSettingsType } from '../schema/sourceOfTruth';

interface AppState {
  sourceOfTruth: SourceOfTruthType;
  mistralApiKey: string;
  
  // Batch/Time-Machine state
  batchMode: boolean;
  selectedBatchIndex: number;
  batchStatements: SourceOfTruthType[];
  batchSettings: {
    startMonth: string;
    startYear: string;
    numberOfMonths: number;
    initialOpeningBalance: number;
    recurringTransactions: Array<{ description: string; amount: number; day: number }>;
  };
  
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
  setSourceOfTruth: (data: SourceOfTruthType) => void;
  
  // Batch Actions
  setBatchMode: (mode: boolean) => void;
  setSelectedBatchIndex: (idx: number) => void;
  setBatchSettings: (settings: Partial<AppState['batchSettings']>) => void;
  generateBatch: () => void;
  cascadeBalances: () => void;
  

}

const initialSourceOfTruth: SourceOfTruthType = {
  bank: {
    bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
    bank_logo_image: '/vuub.png',
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
    statement_year: '2025'
  },
  balances: {
    opening_balance: 0,
    closing_balance: 0,
    total_credit: 0,
    total_debit: 0,
    total_fees: 0,
  },
  transactions: [],
  exportSettings: {
    show_logo: true,
    language: 'sk',
  }
};

const initialBatchSettings = {
  startMonth: '11',
  startYear: '2025',
  numberOfMonths: 3,
  initialOpeningBalance: 1000,
  recurringTransactions: [
    { description: 'Mzda / Výplata', amount: 2500, day: 15 },
    { description: 'Nájomné a poplatky', amount: -650, day: 2 },
    { description: 'Nákup potravín LIDL', amount: -75, day: 10 },
    { description: 'Mobilné služby', amount: -32.50, day: 20 }
  ]
};

export const useAppStore = createWithEqualityFn<AppState>((set, get) => ({
  sourceOfTruth: initialSourceOfTruth,
  mistralApiKey: typeof window !== 'undefined' 
    ? window.localStorage?.getItem('mistral_api_key') || (import.meta.env.VITE_MISTRAL_API_KEY as string) || '' 
    : '',
  
  // Batch initial state
  batchMode: false,
  selectedBatchIndex: 0,
  batchStatements: [],
  batchSettings: initialBatchSettings,

  setSourceOfTruth: (data) => set({ sourceOfTruth: data }),

  setBankData: (data) => set((state) => {
    const updatedBank = { ...state.sourceOfTruth.bank, ...data };
    const updatedBatch = state.batchMode
      ? state.batchStatements.map(s => ({ ...s, bank: updatedBank }))
      : state.batchStatements;
    return {
      sourceOfTruth: {
        ...state.sourceOfTruth,
        bank: updatedBank
      },
      batchStatements: updatedBatch
    };
  }),

  setClientData: (data) => set((state) => {
    const updatedClient = { ...state.sourceOfTruth.client, ...data };
    const updatedBatch = state.batchMode
      ? state.batchStatements.map(s => ({ ...s, client: updatedClient }))
      : state.batchStatements;
    return {
      sourceOfTruth: {
        ...state.sourceOfTruth,
        client: updatedClient
      },
      batchStatements: updatedBatch
    };
  }),

  setStatementData: (data) => set((state) => {
    const updatedStatement = { ...state.sourceOfTruth.statement, ...data };
    const updatedBatch = [...state.batchStatements];
    if (state.batchMode && state.selectedBatchIndex !== null && state.selectedBatchIndex < updatedBatch.length) {
      updatedBatch[state.selectedBatchIndex] = {
        ...updatedBatch[state.selectedBatchIndex],
        statement: updatedStatement
      };
    }
    return {
      sourceOfTruth: {
        ...state.sourceOfTruth,
        statement: updatedStatement
      },
      batchStatements: updatedBatch
    };
  }),

  setExportSettings: (data) => set((state) => {
    const updatedExportSettings = { ...state.sourceOfTruth.exportSettings, ...data };
    const updatedBatch = state.batchMode
      ? state.batchStatements.map(s => ({ ...s, exportSettings: updatedExportSettings }))
      : state.batchStatements;
    return {
      sourceOfTruth: {
        ...state.sourceOfTruth,
        exportSettings: updatedExportSettings
      },
      batchStatements: updatedBatch
    };
  }),

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
      let total_fees = 0;

      transactions.forEach(t => {
        if (t.is_fee) {
          total_fees += Math.abs(t.amount);
        } else if (t.amount >= 0) {
          total_credit += t.amount;
        } else {
          total_debit += Math.abs(t.amount);
        }
      });

      const closing_balance = opening_balance + total_credit - total_debit - total_fees;

      const updatedBalances = {
        opening_balance,
        total_credit,
        total_debit,
        total_fees,
        closing_balance,
      };

      const updatedSourceOfTruth = {
        ...state.sourceOfTruth,
        balances: updatedBalances
      };

      const updatedBatch = [...state.batchStatements];
      if (state.batchMode && state.selectedBatchIndex !== null && state.selectedBatchIndex < updatedBatch.length) {
        updatedBatch[state.selectedBatchIndex] = updatedSourceOfTruth;
      }

      return {
        sourceOfTruth: updatedSourceOfTruth,
        batchStatements: updatedBatch
      };
    });

    if (get().batchMode) {
      get().cascadeBalances();
    }
  },

  setMistralApiKey: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('mistral_api_key', key);
    }
    set({ mistralApiKey: key });
  },

  // Batch Mode Actions
  setBatchMode: (mode) => {
    set({ batchMode: mode });
    if (mode && get().batchStatements.length === 0) {
      get().generateBatch();
    }
  },

  setSelectedBatchIndex: (idx) => set((state) => {
    const selectedTruth = state.batchStatements[idx];
    if (!selectedTruth) return {};
    return {
      selectedBatchIndex: idx,
      sourceOfTruth: selectedTruth
    };
  }),

  setBatchSettings: (settings) => set((state) => ({
    batchSettings: { ...state.batchSettings, ...settings }
  })),

  generateBatch: () => {
    set((state) => {
      const { startMonth, startYear, numberOfMonths, initialOpeningBalance, recurringTransactions } = state.batchSettings;
      const parsedStartMonth = parseInt(startMonth) || 11;
      const parsedStartYear = parseInt(startYear) || 2025;
      const parsedNumMonths = parseInt(String(numberOfMonths)) || 3;
      
      const newStatements: SourceOfTruthType[] = [];
      let currentOpening = initialOpeningBalance;
      
      for (let k = 0; k < parsedNumMonths; k++) {
        const totalMonths = (parsedStartMonth - 1) + k;
        const m = totalMonths % 12; // 0-11
        const y = parsedStartYear + Math.floor(totalMonths / 12);
        
        const monthStr = String(m + 1).padStart(2, '0');
        const yearStr = String(y);
        const lastDay = new Date(y, m + 1, 0).getDate();
        const lastDayStr = String(lastDay).padStart(2, '0');
        
        const period_start = `01.${monthStr}.${yearStr}`;
        const period_end = `${lastDayStr}.${monthStr}.${yearStr}`;
        
        const monthTransactions: TransactionType[] = recurringTransactions.map(rec => {
          const day = Math.min(Math.max(1, parseInt(String(rec.day)) || 1), lastDay);
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `${dayStr}.${monthStr}.${yearStr}`;
          
          const is_fee = rec.description.toLowerCase().includes('poplatok') || rec.description.toLowerCase().includes('vedenie konta');
          const type = is_fee ? 'fee' : (rec.amount >= 0 ? 'incoming' : 'outgoing');

          return {
            date_realiz: dateStr,
            date_valuta: dateStr,
            amount: parseFloat(String(rec.amount)) || 0,
            popis: rec.description || '',
            account: '',
            vs: '',
            ks: '',
            ss: '',
            type,
            is_fee
          };
        });
        
        // Sort transactions by date (day)
        monthTransactions.sort((a, b) => {
          const dayA = parseInt(a.date_realiz.split('.')[0]) || 1;
          const dayB = parseInt(b.date_realiz.split('.')[0]) || 1;
          return dayA - dayB;
        });
        
        let total_credit = 0;
        let total_debit = 0;
        let total_fees = 0;
        monthTransactions.forEach(t => {
          if (t.is_fee) {
            total_fees += Math.abs(t.amount);
          } else if (t.amount >= 0) {
            total_credit += t.amount;
          } else {
            total_debit += Math.abs(t.amount);
          }
        });
        
        const closing_balance = currentOpening + total_credit - total_debit - total_fees;
        
        const statementData: StatementDataType = {
          ...state.sourceOfTruth.statement,
          period_start,
          period_end,
          statement_number: `${monthStr}/${yearStr}`,
          statement_date: period_end,
          statement_month: monthStr,
          statement_year: yearStr
        };
        
        const balancesData = {
          opening_balance: currentOpening,
          total_credit,
          total_debit,
          total_fees,
          closing_balance
        };
        
        newStatements.push({
          bank: { ...state.sourceOfTruth.bank },
          client: { ...state.sourceOfTruth.client },
          statement: statementData,
          balances: balancesData,
          transactions: monthTransactions,
          exportSettings: { ...state.sourceOfTruth.exportSettings }
        });
        
        // Setup opening balance for next month
        currentOpening = closing_balance;
      }
      
      const selectedIdx = 0;
      const initialTruth = newStatements[selectedIdx] || state.sourceOfTruth;
      
      return {
        batchStatements: newStatements,
        selectedBatchIndex: selectedIdx,
        sourceOfTruth: initialTruth
      };
    });
  },

  cascadeBalances: () => {
    set((state) => {
      if (!state.batchMode || state.batchStatements.length === 0) return {};
      
      const updatedBatch = [...state.batchStatements];
      
      // Cascade from first statement to the end
      for (let i = 1; i < updatedBatch.length; i++) {
        const prevClosing = updatedBatch[i - 1].balances.closing_balance;
        const current = updatedBatch[i];
        
        let total_credit = 0;
        let total_debit = 0;
        let total_fees = 0;

        current.transactions.forEach(t => {
          if (t.is_fee) {
            total_fees += Math.abs(t.amount);
          } else if (t.amount >= 0) {
            total_credit += t.amount;
          } else {
            total_debit += Math.abs(t.amount);
          }
        });

        const newClosing = prevClosing + total_credit - total_debit - total_fees;

        updatedBatch[i] = {
          ...current,
          balances: {
            opening_balance: prevClosing,
            total_credit,
            total_debit,
            total_fees,
            closing_balance: newClosing
          }
        };
      }

      // Also sync current sourceOfTruth if the selected batch index was cascaded
      let updatedSourceOfTruth = state.sourceOfTruth;
      if (state.selectedBatchIndex !== null && state.selectedBatchIndex < updatedBatch.length) {
        updatedSourceOfTruth = updatedBatch[state.selectedBatchIndex];
      }

      return {
        batchStatements: updatedBatch,
        sourceOfTruth: updatedSourceOfTruth
      };
    });
  }
}));
