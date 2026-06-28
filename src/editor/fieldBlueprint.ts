export type FieldSection = 'bank' | 'client' | 'statement' | 'balances';

export interface FieldDef {
  section: FieldSection;
  key: string;
  label: string;
  multiline?: boolean;
  type?: 'text' | 'number';
}

export const FIELD_BLUEPRINT: { group: string; fields: FieldDef[] }[] = [
  {
    group: 'Banka',
    fields: [
      { section: 'bank', key: 'bank_logo_id', label: 'Logo banky (text)' },
      { section: 'bank', key: 'bank_register_info', label: 'Registračné info', multiline: true },
      { section: 'bank', key: 'bank_outlet_id', label: 'Kód pobočky' },
      { section: 'bank', key: 'bank_outlet_address', label: 'Adresa pobočky' },
    ],
  },
  {
    group: 'Klient',
    fields: [
      { section: 'client', key: 'client_title', label: 'Názov / Meno' },
      { section: 'client', key: 'client_street', label: 'Ulica' },
      { section: 'client', key: 'client_zip', label: 'PSČ' },
      { section: 'client', key: 'client_city', label: 'Mesto' },
      { section: 'client', key: 'client_iban', label: 'IBAN' },
      { section: 'client', key: 'client_swift', label: 'SWIFT / BIC' },
      { section: 'client', key: 'client_account', label: 'Typ účtu' },
      { section: 'client', key: 'client_id', label: 'IČO klienta' },
      { section: 'client', key: 'client_limit', label: 'Limit prečerpania' },
    ],
  },
  {
    group: 'Výpis',
    fields: [
      { section: 'statement', key: 'statement_number', label: 'Poradové číslo' },
      { section: 'statement', key: 'statement_date', label: 'Dátum vyhotovenia' },
      { section: 'statement', key: 'statement_title', label: 'Titulok výpisu' },
      { section: 'statement', key: 'statement_currency', label: 'Mena' },
      { section: 'statement', key: 'statement_frequency', label: 'Frekvencia výpisov' },
      { section: 'statement', key: 'period_start', label: 'Obdobie od' },
      { section: 'statement', key: 'period_end', label: 'Obdobie do' },
    ],
  },
];