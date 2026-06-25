import { describe, it, expect, beforeAll } from 'vitest';
import { parseStatementWithAI } from '../lib/mistralClient';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually to avoid adding dotenv package
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error('Failed to parse .env.local:', e);
}

describe('Mistral API Live Integration Test', () => {
  const apiKey = process.env.VITE_MISTRAL_API_KEY;

  beforeAll(() => {
    if ((global as any).originalFetch) {
      global.fetch = (global as any).originalFetch;
    }
  });

  it('should successfully parse a raw Slovak VÚB statement using the live Mistral API', async () => {
    if (!apiKey) {
      console.warn('VITE_MISTRAL_API_KEY is not defined in .env.local. Skipping live test.');
      return;
    }

    // Quick connectivity check to see if network is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch('https://api.mistral.ai', { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {
      console.warn('Could not connect to api.mistral.ai (network blocked/sandbox). Skipping live integration test.');
      return;
    }

    const sampleStatementText = `
Všeobecná úverová banka, a.s.
Dátum vyhotovenia: 05.12.2025
Pobočka: 30017 KOMÁRNICKÁ 11, BRATISLAVA
Výpis z účtu číslo: 12/2025
Obdobie od 01.11.2025 do 30.11.2025
Mena: EUR
Frekvencia: mesačne

Klient:
*GIGASTARS, S.R.O.
VILOVÁ 31
851 01 BRATISLAVA-PETRŽALKA
IČO klienta: 36821608
IBAN: SK84 0200 0000 0040 7755 7753
BIC/SWIFT: SUBASKBX
Typ účtu: VÚB Biznis účet Štandard
Limit prečerpania: 0,00

Počiatočný zostatok: 1500,00 EUR

Pohyby na účte:
02.11.2025 02.11.2025  Platba faktúry 2025089, VS: 2025089, KS: 0308, účet: SK11111111111111111111 -500,00 EUR
15.11.2025 15.11.2025  Prichádzajúca platba od partnera ACME, účet: SK22222222222222222222 +2500,00 EUR
28.11.2025 28.11.2025  Poplatok za vedenie účtu -5,00 EUR

Konečný zostatok: 3495,00 EUR
    `;

    console.log('Sending sample statement to Mistral API (live)...');
    const result = await parseStatementWithAI(sampleStatementText, apiKey, 'mistral-large-latest');
    
    console.log('AI Extraction Output:', JSON.stringify(result, null, 2));

    // Verify critical structure fields are present and valid
    expect(result.client).toBeDefined();
    expect(result.client?.client_title).toBe('*GIGASTARS, S.R.O.');
    expect(result.client?.client_iban?.replace(/\s/g, '')).toBe('SK8402000000004077557753');
    
    expect(result.statement).toBeDefined();
    expect(result.statement?.statement_number).toBe('12/2025');
    expect(result.statement?.period_start).toBe('01.11.2025');
    expect(result.statement?.period_end).toBe('30.11.2025');

    expect(result.balances).toBeDefined();
    expect(result.balances?.opening_balance).toBe(1500);

    expect(result.transactions).toBeDefined();
    expect(result.transactions?.length).toBe(3);

    // Verify transactions amounts mapping
    const txs = result.transactions!;
    expect(txs[0].amount).toBe(-500);
    expect(txs[0].vs).toBe('2025089');
    expect(txs[0].ks).toBe('0308');

    expect(txs[1].amount).toBe(2500);
    expect(txs[2].amount).toBe(-5);
  });
});
