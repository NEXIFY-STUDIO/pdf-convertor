#!/usr/bin/env node
/**
 * Ostrý smoke test — Mistral API + magic wand preset
 * Usage: node scripts/smoke-mistral.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const envPath = path.join(root, '.env.local');

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!m) continue;
    let v = m[2] ?? '';
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv();
const apiKey = env.VITE_MISTRAL_API_KEY || env.MISTRAL_API_KEY;

const checks = [];

function ok(name, detail = '') {
  checks.push({ name, pass: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  checks.push({ name, pass: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

console.log('=== SMOKE TEST (ostrý) ===\n');

if (!apiKey) {
  fail('API kľúč', 'chýba VITE_MISTRAL_API_KEY v .env.local');
  process.exit(1);
}
ok('API kľúč', `načítaný (${apiKey.slice(0, 6)}…)`);

let modelsStatus = 0;
try {
  const res = await fetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  modelsStatus = res.status;
  if (res.ok) {
    const data = await res.json();
    const count = Array.isArray(data.data) ? data.data.length : 0;
    ok('Mistral /v1/models', `HTTP ${modelsStatus}, ${count} modelov`);
  } else {
    const body = await res.text();
    fail('Mistral /v1/models', `HTTP ${modelsStatus}: ${body.slice(0, 200)}`);
  }
} catch (e) {
  fail('Mistral /v1/models', e.message);
}

const sampleText = `Slovenská sporiteľňa, a.s.
VÝPIS Z ÚČTU
KOLOMANOV MLYN, S.R.O.
IČO: 57194050
IBAN: SK04 0900 0000 0052 0896 0265
Obdobie: 01.04.2026 – 30.04.2026
Číslo výpisu: 04/2026
Počiatočný zostatok: 2 000,00 EUR
08.04.2026 Prijatá SEPA platba +31 234,67 EUR — DOPRAVOPROJEKT, a.s.
22.04.2026 Prijatá SEPA platba +20 000,00 EUR — DOPRAVOPROJEKT, a.s.
15.04.2026 Okamžitá platba -43 000,00 EUR — SPACE účet
Konečný zostatok: 6 545,40 EUR`;

try {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content:
            'Extract bank statement JSON with keys: client{client_title,client_id}, statement{statement_number,period_start,period_end}, balances{opening_balance,closing_balance}, transactions[{amount,popis}]. Output ONLY JSON.',
        },
        { role: 'user', content: sampleText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    fail('Chat completions (extrakcia)', `HTTP ${res.status}: ${body.slice(0, 300)}`);
  } else {
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content);
    const title = parsed.client?.client_title ?? '';
    const ico = parsed.client?.client_id ?? '';
    const txCount = Array.isArray(parsed.transactions) ? parsed.transactions.length : 0;
    if (title.toUpperCase().includes('KOLOMANOV') || ico === '57194050') {
      ok('Chat completions (extrakcia)', `klient OK, ${txCount} transakcií`);
    } else {
      fail('Chat completions (extrakcia)', `neočakávaný klient: ${title || ico || '?'}`);
    }
  }
} catch (e) {
  fail('Chat completions (extrakcia)', e.message);
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n=== VÝSLEDOK: ${checks.length - failed.length}/${checks.length} OK ===`);
process.exit(failed.length ? 1 : 0);