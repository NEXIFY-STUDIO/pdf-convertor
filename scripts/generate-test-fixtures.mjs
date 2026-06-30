#!/usr/bin/env node
/** Generuje chýbajúce test fixtures pre production testy */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const fixtures = path.join(root, 'tests/fixtures');
const outputs = path.join(root, 'tests/outputs');

for (const dir of [fixtures, outputs]) {
  fs.mkdirSync(dir, { recursive: true });
}

const transactions = Array.from({ length: 19 }, (_, i) => {
  const day = String((i % 28) + 1).padStart(2, '0');
  const date = `${day}.07.2022`;
  const outgoing = i % 3 === 0;
  const amount = outgoing ? -(45.5 + i * 2.1) : 80 + i * 3.7;
  const desc =
    i === 4
      ? 'ZSE ENERGIA, A.S. — elektrina za júl'
      : i === 12
        ? 'Slovenský telekom — služby'
        : i === 7
          ? 'Železničná stanica — lístok'
          : `Platba protistrana ${i + 1}`;

  return {
    date_realiz: date,
    date_booking: date,
    date_valuta: date,
    amount: Math.round(amount * 100) / 100,
    description: desc,
    popis: desc,
    account: 'SK11 0200 0000 2700 0210 7012',
    vs: i % 2 === 0 ? String(1000000 + i) : undefined,
    ks: i % 4 === 0 ? '0308' : undefined,
    type: outgoing ? 'outgoing' : 'incoming',
    is_fee: false,
  };
});

const sourceOfTruth = {
  bank: {
    bank_logo_id: 'VÚB, a.s.',
    bank_register_info:
      'VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava, Obch. reg.: Okresný súd Bratislava 1, Oddiel: Sa, Vložka č. 341/B, IČO: 31320155',
    bank_outlet_id: '30017',
    bank_outlet_address: 'Svätotrojičné nám. 8, Krupina',
  },
  client: {
    client_title: 'MONIKA KUPČOVÁ',
    client_street: 'HRONSKÉ KLAČANY 277',
    client_zip: '935 29',
    client_city: 'HRONSKÉ KLAČANY',
    client_iban: 'SK70 0200 0000 0011 4286 3551',
    client_swift: 'SUBASKBX',
    client_account: 'Bežný účet',
    client_id: '12345678',
    client_limit: '0,00',
  },
  statement: {
    period_start: '01.07.2022',
    period_end: '31.07.2022',
    statement_number: '7/2022',
    statement_frequency: 'mesačne',
    statement_title: 'VÝPIS Z ÚČTU',
    statement_date: '31.07.2022',
    statement_currency: 'EUR',
    statement_month: '07',
    statement_year: '2022',
  },
  balances: {
    opening_balance: 1708.49,
    closing_balance: 1837.22,
    total_credit: 716.22,
    total_debit: 580.61,
    total_fees: 6.88,
  },
  transactions,
  exportSettings: { show_logo: true, language: 'sk' },
};

const txtFixture = `VÚB, a.s.
Por. číslo: 7/2022
Obdobie od 01.07.2022 do 31.07.2022
Klient: MONIKA KUPČOVÁ
HRONSKÉ KLAČANY 277
IBAN: SK70 0200 0000 0011 4286 3551
Počiatočný zostatok: 1708,49 EUR
(pozri tests/outputs/ai_extracted_data.json — 19 transakcií)
`;

fs.writeFileSync(
  path.join(fixtures, '589815263-inbound2080046449.txt'),
  txtFixture,
);
fs.writeFileSync(
  path.join(fixtures, 'ai_extracted_data.json'),
  JSON.stringify(sourceOfTruth, null, 2),
);
fs.writeFileSync(
  path.join(outputs, 'ai_extracted_data.json'),
  JSON.stringify(sourceOfTruth, null, 2),
);

// --- SLSP Fixture (test-slsp) ---
const testSlspData = {
  "Header Info": {
    "Banka": {
      "Názov": "Slovenská sporiteľňa, a.s.",
      "Adresa": "Tomášikova 48, 832 37 Bratislava",
      "IČO": "00 151 653",
      "Zápis v registri": "Obchodnom registri Mestského súdu Bratislava III., oddiel Sa, vložka č. 601/B"
    },
    "Typ výpisu": "Výpis z Účtu: Business účet S",
    "Názov Účtu": "DALMAN group s. r. o.",
    "Adresa klienta": "Hodvábna 4269/13, 071 01 Michalovce 1",
    "Číslo Účtu (IBAN)": "SK04 0900 0000 0052 0896 0265",
    "BIC": "GIBASKBX",
    "Mena": "EUR",
    "Dátum vyhotovenia výpisu": "31. 03. 2026",
    "Účtovné obdobie": "01. 03. 2026 - 31. 03. 2026"
  },
  "Balances": {
    "Počiatočný stav Účtu": "40 350,00",
    "Vklady spolu": "40 350,00",
    "Výbery spolu": "40 350,00",
    "Konečný stav Účtu": "40 350,00",
    "Transakčná daň spolu": "- 80,09"
  },
  "Transactions": [
    {
      "Dátum valuty": "02. 03. 2026",
      "Dátum zúčtovania": "02. 03. 2026",
      "Popis transakcie": "Príjem platby od klienta ABC s.r.o., VS: 202603001, KS: 0308",
      "Suma transakcie": "15 000,00",
      "Suma poplatku": "0,00"
    },
    {
      "Dátum valuty": "12. 03. 2026",
      "Dátum zúčtovania": "12. 03. 2026",
      "Popis transakcie": "Platba dodávateľovi XYZ s.r.o., faktúra č. XYZ-2026-015, IBAN: SK12 0900 0000 0000 1234 5678",
      "Suma transakcie": "-20 000,00",
      "Suma poplatku": "0,00"
    },
    {
      "Dátum valuty": "28. 03. 2026",
      "Dátum zúčtovania": "28. 03. 2026",
      "Popis transakcie": "Poplatok za vedenie účtu Business účet S a transakčná daň",
      "Suma transakcie": "-5 350,00",
      "Suma poplatku": "0,00"
    }
  ],
  "Tax Summary": {
    "Transakčná daň": {
      "Suma": "- 80,03",
      "Počet kusov": "2 ks"
    },
    "Transakčná daň (z poplatkov, úrokov)": {
      "Suma": "- 0,06",
      "Počet kusov": "1 ks"
    }
  }
};

fs.writeFileSync(
  path.join(fixtures, 'test-slsp.json'),
  JSON.stringify(testSlspData, null, 2),
);
fs.writeFileSync(
  path.join(outputs, 'test-slsp.json'),
  JSON.stringify(testSlspData, null, 2),
);

console.log('✓ Test fixtures vygenerované (VÚB + SLSP: test-slsp.json)');