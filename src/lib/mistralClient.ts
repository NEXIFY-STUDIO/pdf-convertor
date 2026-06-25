import { SourceOfTruthType } from '../schema/sourceOfTruth';

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function parseStatementWithAI(
  statementText: string,
  apiKey: string,
  model: string = 'mistral-large-latest'
): Promise<Partial<SourceOfTruthType>> {
  if (!apiKey) {
    throw new Error('Chýba Mistral API kľúč. Zadajte ho prosím v nastaveniach.');
  }

  const systemPrompt = `Si špecializovaný AI asistent na analýzu bankových výpisov. Tvojou jedinou úlohou je zanalyzovať surový text bankového výpisu a skonvertovať ho do štruktúrovaného JSON formátu podľa špecifikácie.

Vráť výhradne čistý validný JSON objekt, bez akýchkoľvek Markdown značiek (\`\`\`json) alebo dodatočného textu.

Požadovaná JSON štruktúra:
{
  "client": {
    "client_title": "Úplný názov/meno klienta",
    "client_street": "Ulica a číslo",
    "client_zip": "PSČ (napr. 851 01)",
    "client_city": "Mesto",
    "client_iban": "IBAN klienta (SK...)",
    "client_swift": "SWIFT/BIC kód banky klienta (8-11 znakov)",
    "client_account": "Voliteľný popis účtu (napr. VÚB Biznis účet)",
    "client_id": "Voliteľné IČO/rodné číslo klienta",
    "client_limit": "Voliteľný limit prečerpania (formát napr. '0,00')"
  },
  "statement": {
    "period_start": "Začiatok obdobia vo formáte DD.MM.YYYY",
    "period_end": "Koniec obdobia vo formáte DD.MM.YYYY",
    "statement_number": "Číslo výpisu (napr. '11/2025')",
    "statement_frequency": "Frekvencia výpisov (napr. 'mesačne')",
    "statement_title": "Názov dokumentu (predvolené 'VÝPIS Z ÚČTU')",
    "statement_date": "Dátum vyhotovenia vo formáte DD.MM.YYYY",
    "statement_currency": "Mena (napr. 'EUR')"
  },
  "balances": {
    "opening_balance": Počiatočný zostatok ako číslo (float)
  },
  "transactions": [
    {
      "date_realiz": "Dátum realizácie vo formáte DD.MM.YYYY",
      "date_valuta": "Dátum valuty vo formáte DD.MM.YYYY",
      "amount": Suma transakcie ako číslo. POZOR: Pre debetné transakcie (platby, výbery, poplatky) musí byť číslo záporné (napr. -250.5), pre kreditné transakcie (prichádzajúce platby, vklady) musí byť číslo kladné (napr. 1500.0).",
      "popis": "Popis transakcie (napr. názov protistrany, účel platby, referencia platiteľa)",
      "account": "Voliteľný IBAN protistrany (ak je k dispozícii)",
      "vs": "Voliteľný variabilný symbol (iba číslice, max 10 znakov)",
      "ks": "Voliteľný konštantný symbol (iba číslice, max 4 znaky)",
      "ss": "Voliteľný špecifický symbol (iba číslice, max 10 znakov)"
    }
  ]
}

Pravidlá:
1. Ak niektoré informácie o klientovi alebo banke chýbajú, pokús sa ich odvodiť alebo použi prázdny reťazec "", prípadne zachovaj predvolené hodnoty pre VÚB banku ak je to možné.
2. Dátumy musia byť striktne vo formáte DD.MM.YYYY.
3. Transakčné symboly (vs, ks, ss) musia obsahovať iba číslice. Odstráň akékoľvek iné znaky alebo písmená. Ak chýbajú, nevkladaj ich (vynechaj alebo nastav na undefined).
4. Suma 'amount' musí byť číslo. Nikdy nevracaj sumu ako string. Nezabudni na záporné znamienko pre výdavky.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Zanalyzuj nasledovný bankový výpis a skonvertuj ho do požadovaného JSON:\n\n${statementText}` }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.message || `HTTP error ${response.status}`;
      throw new Error(`Chyba API Mistral: ${errMsg}`);
    }

    const data: MistralResponse = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Mistral API nevrátilo žiadny obsah.');
    }

    // Parse the JSON
    const parsedData = JSON.parse(content);
    return parsedData;
  } catch (error: any) {
    console.error('AI parsing error:', error);
    throw new Error(error.message || 'Nepodarilo sa spracovať výpis pomocou AI.');
  }
}
