import type { TransactionType } from '../schema/sourceOfTruth';

/** Normalize raw import rows into validated transaction shape. */
export function normalizeTransaction(row: Record<string, unknown>): TransactionType {
  const dateRealiz = String(
    row.transfer_confirmed_date || row.date_realiz || row.Date || row.date || '',
  );
  const dateBooking = String(row.date_booking || dateRealiz);
  const dateValuta = String(
    row.transfer_currency_date || row.date_valuta || row.Date || row.date || dateRealiz || '',
  );

  let amt = 0;
  if (row.transfer_amount !== undefined) {
    amt = parseFloat(String(row.transfer_amount));
    if (row.transfer_type === 'outgoing') {
      amt = -Math.abs(amt);
    } else {
      amt = Math.abs(amt);
    }
  } else {
    amt = parseFloat(String(row.Amount || row.amount || '0'));
  }

  const popis = String(row.transfer_description || row.popis || row.description || row.Description || '');
  const account = String(row.transfer_recipient_iban || row.account || '');
  const vs = row.transfer_variable_symbol || row.vs;
  const ks = row.transfer_constant_symbol || row.ks;
  const ss = row.transfer_specific_symbol || row.ss;
  const bankRef = row.bank_ref;
  const feeType = row.fee_type;

  const detailsRaw = row.details;
  const details = Array.isArray(detailsRaw)
    ? detailsRaw.map((d) => String(d).trim()).filter(Boolean)
    : undefined;

  const isFee = row.is_fee === true || row.type === 'fee' || false;
  const type = (row.type === 'fee' || isFee)
    ? 'fee'
    : ((row.transfer_type || row.type || (amt >= 0 ? 'incoming' : 'outgoing')) as TransactionType['type']);

  return {
    date_realiz: dateRealiz,
    date_booking: dateBooking,
    date_valuta: dateValuta,
    amount: amt,
    popis,
    account: account || undefined,
    vs: vs != null && vs !== '' ? String(vs) : undefined,
    ks: ks != null && ks !== '' ? String(ks) : undefined,
    ss: ss != null && ss !== '' ? String(ss) : undefined,
    details,
    bank_ref: bankRef != null && bankRef !== '' ? String(bankRef) : undefined,
    fee_type: feeType != null && feeType !== '' ? String(feeType) : undefined,
    type,
    is_fee: isFee,
  };
}

export function normalizeTransactions(rows: unknown[]): TransactionType[] {
  return rows.map((row) => normalizeTransaction(row as Record<string, unknown>));
}