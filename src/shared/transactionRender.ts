import type { TransactionType } from '../schema/sourceOfTruth';

const BIC_MAP: Record<string, string> = {
  '0200': 'SUBASKBX',
  '6500': 'POBNSKBA',
  '0900': 'GIBASKBX',
  '5600': 'KOMASK2X',
  '1111': 'UNCRSKBX',
  '8180': 'SPSRSKBAXXX',
  '1100': 'TATRSKBX',
};

export function formatIbanWithSpaces(iban?: string): string {
  if (!iban) return '';
  const clean = iban.replace(/\s/g, '');
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

export function getBicFromIban(iban?: string): string {
  if (!iban) return '';
  const bankCode = iban.replace(/\s/g, '').substring(4, 8);
  return BIC_MAP[bankCode] || '';
}

export function getPayerRef(t: Pick<TransactionType, 'vs' | 'ks' | 'ss'>): string {
  if (t.vs === undefined && t.ss === undefined && t.ks === undefined) return '';
  if (!t.vs && !t.ss && !t.ks) return 'Neuvedené';
  return `/VS${t.vs || ''}/SS${t.ss || ''}/KS${t.ks || ''}`;
}

/** Build PDF column-3 lines from structured or flat transaction data. */
export function buildTransactionDetails(t: TransactionType): string[] {
  const lines: string[] = [];
  const accountFormatted = formatIbanWithSpaces(t.account);

  if (accountFormatted) lines.push(accountFormatted);

  if (t.popis) {
    t.popis.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => lines.push(line));
  }

  const bic = getBicFromIban(t.account);
  if (bic && !lines.some((l) => l.startsWith('BIC:'))) {
    lines.push(`BIC: ${bic}`);
  }

  const payerRef = getPayerRef(t);
  if (payerRef && !lines.some((l) => l.includes('Referencia platiteľa'))) {
    lines.push(`Referencia platiteľa: ${payerRef}`);
  }

  return lines;
}

export function getTransactionLines(t: TransactionType): string[] {
  if (t.details?.length) {
    return t.details.filter((line) => line.trim() !== '');
  }

  const built = buildTransactionDetails(t);
  if (built.length > 0) return built;

  return [t.popis || ''];
}

export function getTransactionCol4Lines(t: TransactionType): string[] {
  const vs = t.vs || '';
  const bankRef = t.bank_ref || '';

  if (!vs && bankRef) return ['', bankRef];
  if (vs && !bankRef) return [vs];
  if (!vs && !bankRef) return [''];
  return [vs, bankRef];
}

export function getTransactionCol7Value(t: TransactionType): string {
  if (t.fee_type) return t.fee_type;
  if (t.is_fee) return 'I';
  return '';
}