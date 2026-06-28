import { describe, it, expect } from 'vitest';
import { normalizeTransaction, normalizeTransactions } from '../shared/normalizeTransaction';

describe('normalizeTransaction', () => {
  it('should map George/transfer field names to TransactionType', () => {
    const tx = normalizeTransaction({
      transfer_confirmed_date: '15.11.2025',
      transfer_currency_date: '14.11.2025',
      transfer_amount: 250.5,
      transfer_type: 'incoming',
      transfer_description: 'Výplata',
      transfer_recipient_iban: 'SK8402000000004077557753',
      transfer_variable_symbol: '123',
      transfer_constant_symbol: '0308',
      transfer_specific_symbol: '99',
      details: ['Riadok 1', 'Riadok 2'],
      bank_ref: 'REF-001',
      fee_type: 'L',
    });

    expect(tx.date_realiz).toBe('15.11.2025');
    expect(tx.date_booking).toBe('15.11.2025');
    expect(tx.date_valuta).toBe('14.11.2025');
    expect(tx.amount).toBe(250.5);
    expect(tx.popis).toBe('Výplata');
    expect(tx.account).toBe('SK8402000000004077557753');
    expect(tx.vs).toBe('123');
    expect(tx.ks).toBe('0308');
    expect(tx.ss).toBe('99');
    expect(tx.details).toEqual(['Riadok 1', 'Riadok 2']);
    expect(tx.bank_ref).toBe('REF-001');
    expect(tx.fee_type).toBe('L');
    expect(tx.type).toBe('incoming');
    expect(tx.is_fee).toBe(false);
  });

  it('should negate outgoing transfer_amount', () => {
    const tx = normalizeTransaction({
      transfer_amount: 100,
      transfer_type: 'outgoing',
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
    });
    expect(tx.amount).toBe(-100);
    expect(tx.type).toBe('outgoing');
  });

  it('should fall back to amount/Amount and CSV-style fields', () => {
    const tx = normalizeTransaction({
      Date: '02.01.2025',
      Amount: '-50.25',
      Description: 'Nákup',
      date_booking: '03.01.2025',
    });
    expect(tx.date_realiz).toBe('02.01.2025');
    expect(tx.date_valuta).toBe('02.01.2025');
    expect(tx.date_booking).toBe('03.01.2025');
    expect(tx.amount).toBe(-50.25);
    expect(tx.popis).toBe('Nákup');
  });

  it('should treat fee type and strip empty optional symbols', () => {
    const tx = normalizeTransaction({
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
      amount: -5,
      type: 'fee',
      is_fee: true,
      vs: '',
      ks: null,
      ss: undefined,
      bank_ref: '',
      fee_type: '',
    });
    expect(tx.type).toBe('fee');
    expect(tx.is_fee).toBe(true);
    expect(tx.vs).toBeUndefined();
    expect(tx.ks).toBeUndefined();
    expect(tx.ss).toBeUndefined();
    expect(tx.bank_ref).toBeUndefined();
    expect(tx.fee_type).toBeUndefined();
  });

  it('should accept description alias and filter empty details', () => {
    const tx = normalizeTransaction({
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
      amount: 10,
      description: 'AI popis',
      details: ['  ok  ', '', '  '],
    });
    expect(tx.popis).toBe('AI popis');
    expect(tx.details).toEqual(['ok']);
  });

  it('should omit account when empty string', () => {
    const tx = normalizeTransaction({
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
      amount: 0,
      account: '',
    });
    expect(tx.account).toBeUndefined();
  });

  it('should default empty dates when fields missing', () => {
    const tx = normalizeTransaction({ amount: 0 });
    expect(tx.date_realiz).toBe('');
    expect(tx.date_valuta).toBe('');
    expect(tx.date_booking).toBe('');
  });

  it('should infer incoming type for positive amount without type', () => {
    const tx = normalizeTransaction({
      date_realiz: '01.01.2025',
      date_valuta: '01.01.2025',
      amount: 42,
    });
    expect(tx.type).toBe('incoming');
  });

  it('should normalize batch of rows', () => {
    const rows = normalizeTransactions([
      { date_realiz: '01.01.2025', date_valuta: '01.01.2025', amount: 1 },
      { date_realiz: '02.01.2025', date_valuta: '02.01.2025', amount: -2 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].amount).toBe(1);
    expect(rows[1].amount).toBe(-2);
  });
});