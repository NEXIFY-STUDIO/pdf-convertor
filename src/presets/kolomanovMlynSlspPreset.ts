import type { SourceOfTruthType, TransactionType } from '../schema/sourceOfTruth';

/** IČO 57194050 — Kolomanov Mlyn s.r.o., Košice (ORSR / finstat) */
export const KOLOMANOV_MLYN_CLIENT = {
  client_title: 'KOLOMANOV MLYN, S.R.O.',
  client_street: 'JENISEJSKÁ 2441/45A',
  client_zip: '040 12',
  client_city: 'KOŠICE - MESTSKÁ ČASŤ NAD JAZEROM',
  client_iban: 'SK04 0900 0000 0052 0896 0265',
  client_swift: 'GIBASKBX',
  client_account: 'Business účet S',
  client_id: '57194050',
  client_limit: '0,00',
} as const;

export const SLSP_BANK = {
  bank_logo_id: 'Slovenská sporiteľňa, a.s.',
  bank_logo_image: undefined,
  bank_register_info:
    'Slovenská sporiteľňa, a.s., Tomášikova 48, 832 37 Bratislava, Obch. reg.: Mestský súd Bratislava III, Oddiel: Sa, Vložka č. 601/B, IČO: 00151741, www.slsp.sk',
  bank_outlet_id: '0900',
  bank_outlet_address: 'TOMÁŠIKOVA 48, BRATISLAVA',
} as const;

export const MAX_PAYMENTS_PER_STATEMENT = 10;

/** Mesačný kreditný obrat 50 000 – 54 000 € so stotinami (nie zaokrúhlené) */
export const TARGET_MONTHLY_CREDITS = [51_234.67, 52_891.33, 53_756.89] as const;

/** Cieľové konečné zostatky */
export const TARGET_CLOSING_BALANCES = [6545.4, 4444.5, 5909.9] as const;

export const MAGIC_WAND_BATCH_SETTINGS = {
  startMonth: '04',
  startYear: '2026',
  numberOfMonths: 3,
  initialOpeningBalance: 2000,
  recurringTransactions: [] as Array<{ description: string; amount: number; day: number }>,
};

type MonthSpec = { month: number; year: number; lastDay: number };

function padDay(day: number): string {
  return String(day).padStart(2, '0');
}

function dateStr(day: number, month: number, year: number): string {
  return `${padDay(day)}.${String(month).padStart(2, '0')}.${year}`;
}

function sepaIncoming(
  day: number,
  spec: MonthSpec,
  amount: number,
  counterparty: string,
  iban: string,
): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount,
    type: 'incoming',
    popis: 'Prijatá SEPA platba',
    account: iban,
    details: [
      iban,
      counterparty,
      'BIC: GIBASKBX',
      'Referencia platiteľa: Neuvedené',
    ],
    is_fee: false,
  };
}

function instantOutgoing(
  day: number,
  spec: MonthSpec,
  amount: number,
  counterparty: string,
  iban: string,
  vs?: string,
  bankRef?: string,
): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount: -Math.abs(amount),
    type: 'outgoing',
    popis: 'Okamžitá platba',
    account: iban,
    vs,
    bank_ref: bankRef,
    details: [
      iban,
      counterparty,
      ...(bankRef ? [`QR ${vs ?? ''} ${bankRef}`.trim()] : []),
      'BIC: COBADEFFXXX',
      `Referencia platiteľa: /VS${vs ?? ''}/SS/KS`,
    ],
    is_fee: false,
  };
}

function cardPayment(day: number, spec: MonthSpec, amount: number, merchant: string): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount: -Math.abs(amount),
    type: 'outgoing',
    popis: `Platba kartou — ${merchant}`,
    is_fee: false,
  };
}

function transactionTax(day: number, spec: MonthSpec, baseAmount: number): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount: -40,
    type: 'fee',
    popis: 'Transakčná daň',
    fee_type: 'I',
    is_fee: true,
    details: [`základ: ${baseAmount.toFixed(2).replace('.', ',')} EUR`],
  };
}

function accountFee(day: number, spec: MonthSpec): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount: -8,
    type: 'fee',
    popis: 'Poplatok za vedenie účtu',
    fee_type: 'I',
    is_fee: true,
  };
}

function feeTax(day: number, spec: MonthSpec): TransactionType {
  const d = dateStr(day, spec.month, spec.year);
  return {
    date_realiz: d,
    date_booking: d,
    date_valuta: d,
    amount: -0.03,
    type: 'fee',
    popis: 'Transakčná daň',
    fee_type: 'I',
    is_fee: true,
    details: ['základ: 8,00 EUR', 'z poplatkov, úrokov'],
  };
}

const DOPRAVOPROJEKT_IBAN = 'SK37 0900 0000 0052 1995 9374';
const DKV_IBAN = 'DE03 1004 0060 1500 0395 48';
const SPACE_IBAN = 'SK72 0900 0000 0052 1130 0815';
const LOGICALL_IBAN = 'SK02 1100 0000 0029 2085 0015';
const FINSTAT_IBAN = 'SK91 7500 0000 0040 2608 7974';

/**
 * Presne 10 riadkov/mesiac → 2-stranový PDF.
 * Obrat 50–54 tis. so stotinami, konečné zostatky: 6 545,40 / 4 444,50 / 5 909,90 €
 */
function buildMonthTransactions(spec: MonthSpec): TransactionType[] {
  const { month } = spec;

  if (month === 4) {
    return [
      sepaIncoming(8, spec, 31_234.67, 'DOPRAVOPROJEKT, a.s.', DOPRAVOPROJEKT_IBAN),
      sepaIncoming(22, spec, 20_000, 'DOPRAVOPROJEKT, a.s.', DOPRAVOPROJEKT_IBAN),
      instantOutgoing(15, spec, 43_000, 'SPACE účet', SPACE_IBAN),
      transactionTax(15, spec, 43_000),
      instantOutgoing(18, spec, 3_554.34, 'DKV Euro Service GmbH Co', DKV_IBAN, '4302010825', '26/650420580/000'),
      transactionTax(18, spec, 3_554.34),
      cardPayment(12, spec, 12.18, 'GOPAY *IDOKLAD.SK-BRATISLAVA'),
      cardPayment(24, spec, 34.72, 'vintrica vintrica.com'),
      accountFee(spec.lastDay, spec),
      feeTax(spec.lastDay, spec),
    ];
  }

  if (month === 5) {
    return [
      sepaIncoming(3, spec, 20_123.45, 'DOPRAVOPROJEKT, a.s.', DOPRAVOPROJEKT_IBAN),
      sepaIncoming(14, spec, 32_767.88, 'DOPRAVOPROJEKT, a.s.', DOPRAVOPROJEKT_IBAN),
      instantOutgoing(5, spec, 28_000, 'SPACE účet', SPACE_IBAN),
      transactionTax(5, spec, 28_000),
      instantOutgoing(6, spec, 12_400, 'LogiCall Slovensko', LOGICALL_IBAN, '2664200109'),
      transactionTax(6, spec, 12_400),
      instantOutgoing(20, spec, 14_273.79, 'DKV Euro Service GmbH Co', DKV_IBAN, '4302010825', '26/651055937/000'),
      cardPayment(21, spec, 230.41, 'Booking.com-London'),
      accountFee(spec.lastDay, spec),
      feeTax(spec.lastDay, spec),
    ];
  }

  return [
    sepaIncoming(5, spec, 256.89, 'Denis Migaľ', SPACE_IBAN),
    sepaIncoming(15, spec, 33_500, 'DOPRAVOPROJEKT, a.s.', DOPRAVOPROJEKT_IBAN),
    sepaIncoming(28, spec, 20_000, '099 s.r.o.', 'SK79 0900 0000 0052 2700 2273'),
    instantOutgoing(10, spec, 27_000, 'SPACE účet', SPACE_IBAN),
    transactionTax(10, spec, 27_000),
    instantOutgoing(10, spec, 12_781.32, 'DKV Euro Service GmbH Co', DKV_IBAN, '4302010825', '26/652648742/000'),
    transactionTax(10, spec, 12_781.32),
    instantOutgoing(16, spec, 12_422.14, 'FinStat, s.r.o.', FINSTAT_IBAN, '920260589'),
    accountFee(spec.lastDay, spec),
    feeTax(spec.lastDay, spec),
  ];
}

function calcBalances(opening: number, transactions: TransactionType[]) {
  let total_credit = 0;
  let total_debit = 0;
  let total_fees = 0;

  transactions.forEach((t) => {
    if (t.is_fee) {
      total_fees += Math.abs(t.amount);
    } else if (t.amount >= 0) {
      total_credit += t.amount;
    } else {
      total_debit += Math.abs(t.amount);
    }
  });

  return {
    opening_balance: opening,
    total_credit,
    total_debit,
    total_fees,
    closing_balance: opening + total_credit - total_debit - total_fees,
  };
}

function buildStatement(spec: MonthSpec, opening: number): SourceOfTruthType {
  const monthStr = String(spec.month).padStart(2, '0');
  const yearStr = String(spec.year);
  const lastDayStr = padDay(spec.lastDay);
  const transactions = buildMonthTransactions(spec);

  return {
    bank: { ...SLSP_BANK },
    client: { ...KOLOMANOV_MLYN_CLIENT },
    statement: {
      period_start: `01.${monthStr}.${yearStr}`,
      period_end: `${lastDayStr}.${monthStr}.${yearStr}`,
      statement_number: `${monthStr}/${yearStr}`,
      statement_frequency: 'mesačne',
      statement_title: 'VÝPIS Z ÚČTU',
      statement_date: `${lastDayStr}.${monthStr}.${yearStr}`,
      statement_currency: 'EUR',
      statement_month: monthStr,
      statement_year: yearStr,
    },
    balances: calcBalances(opening, transactions),
    transactions,
    exportSettings: { show_logo: true, language: 'sk' },
  };
}

/** 3 výpisy: apríl, máj, jún 2026 — max 10 platieb, 2 strany PDF */
export function buildKolomanovMlynBatch(): SourceOfTruthType[] {
  const specs: MonthSpec[] = [
    { month: 4, year: 2026, lastDay: 30 },
    { month: 5, year: 2026, lastDay: 31 },
    { month: 6, year: 2026, lastDay: 30 },
  ];

  const statements: SourceOfTruthType[] = [];
  let opening = MAGIC_WAND_BATCH_SETTINGS.initialOpeningBalance;

  for (const spec of specs) {
    const stmt = buildStatement(spec, opening);
    statements.push(stmt);
    opening = stmt.balances.closing_balance;
  }

  return statements;
}

/** Surový text pre AI import */
export const MAGIC_WAND_AI_PROMPT = `Slovenská sporiteľňa, a.s.
VÝPIS Z ÚČTU

${KOLOMANOV_MLYN_CLIENT.client_title}
${KOLOMANOV_MLYN_CLIENT.client_street}
${KOLOMANOV_MLYN_CLIENT.client_zip} ${KOLOMANOV_MLYN_CLIENT.client_city}
IČO: ${KOLOMANOV_MLYN_CLIENT.client_id}

IBAN: ${KOLOMANOV_MLYN_CLIENT.client_iban}
BIC: ${KOLOMANOV_MLYN_CLIENT.client_swift}

Obdobie: 01.04.2026 – 30.04.2026
Počiatočný zostatok: 2 000,00 EUR

08.04.2026 Prijatá SEPA platba +31 234,67 EUR — DOPRAVOPROJEKT, a.s.
22.04.2026 Prijatá SEPA platba +20 000,00 EUR — DOPRAVOPROJEKT, a.s.
15.04.2026 Okamžitá platba -43 000,00 EUR — SPACE účet
18.04.2026 Okamžitá platba -3 554,34 EUR — DKV Euro Service GmbH Co

Celkový kredit (obrat): 51 234,67 EUR
Konečný zostatok: 6 545,40 EUR
`;