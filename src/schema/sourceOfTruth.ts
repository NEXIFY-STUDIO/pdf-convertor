import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string().optional(),
  date_realiz: z.string().min(1, 'Dátum realizácie je povinný'),
  date_valuta: z.string().min(1, 'Dátum valuty je povinný'),
  amount: z.number(),
  account: z.string().optional(),
  vs: z.string().optional(),
  ks: z.string().optional(),
  ss: z.string().optional(),
  type: z.string().optional(),
  popis: z.string().optional(),
});

export const ClientDataSchema = z.object({
  client_title: z.string().min(1, 'Názov klienta je povinný'),
  client_street: z.string().min(1, 'Ulica je povinná'),
  client_zip: z.string().min(1, 'PSČ je povinné'),
  client_city: z.string().min(1, 'Mesto je povinné'),
  client_iban: z.string().min(15, 'Zadajte platný IBAN'),
  client_swift: z.string().min(8, 'Zadajte platný SWIFT / BIC'),
  client_account: z.string().optional(),
  client_id: z.string().optional(),
  client_limit: z.string().optional(),
});

export const StatementDataSchema = z.object({
  period_start: z.string().min(1, 'Začiatok obdobia je povinný'),
  period_end: z.string().min(1, 'Koniec obdobia je povinný'),
  statement_number: z.string().min(1, 'Číslo výpisu je povinné'),
  statement_frequency: z.string().optional(),
  statement_title: z.string().optional(),
  statement_date: z.string().optional(),
  statement_currency: z.string().optional(),
  statement_month: z.string().optional(),
  statement_year: z.string().optional(),
  statement_cur_page: z.string().optional(),
  statement_all_pages: z.string().optional(),
});

export const BankDataSchema = z.object({
  bank_logo_id: z.string().min(1, 'Bank logo ID je povinné'),
  bank_logo_image: z.string().optional(),
  bank_register_info: z.string().min(1, 'Registračné info je povinné'),
  bank_outlet_id: z.string().min(1, 'Pobočka je povinná'),
  bank_outlet_address: z.string().min(1, 'Adresa pobočky je povinná'),
});

export const BalancesSchema = z.object({
  opening_balance: z.number(),
  closing_balance: z.number(),
  total_credit: z.number(),
  total_debit: z.number(),
});

export const ExportSettingsSchema = z.object({
  show_logo: z.boolean().default(true),
  language: z.enum(['sk', 'en']).default('sk'),
});

export const SourceOfTruthSchema = z.object({
  bank: BankDataSchema,
  client: ClientDataSchema,
  statement: StatementDataSchema,
  balances: BalancesSchema,
  transactions: z.array(TransactionSchema),
  exportSettings: ExportSettingsSchema,
});

export type TransactionType = z.infer<typeof TransactionSchema>;
export type ClientDataType = z.infer<typeof ClientDataSchema>;
export type StatementDataType = z.infer<typeof StatementDataSchema>;
export type BankDataType = z.infer<typeof BankDataSchema>;
export type BalancesType = z.infer<typeof BalancesSchema>;
export type ExportSettingsType = z.infer<typeof ExportSettingsSchema>;
export type SourceOfTruthType = z.infer<typeof SourceOfTruthSchema>;
