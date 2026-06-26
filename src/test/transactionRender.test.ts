import { describe, it, expect } from 'vitest';
import {
  getTransactionLines,
  getTransactionCol4Lines,
  getTransactionCol7Value,
  buildTransactionDetails,
} from '../shared/transactionRender';
import type { TransactionType } from '../schema/sourceOfTruth';

const baseTx: TransactionType = {
  date_realiz: '01.07.2022',
  date_valuta: '01.07.2022',
  amount: -92,
  type: 'outgoing',
  is_fee: false,
};

describe('transactionRender', () => {
  it('should use explicit details when provided', () => {
    const tx: TransactionType = {
      ...baseTx,
      details: ['SK11 0200 0000 2700 0210 7012', 'ZSE ENERGIA, A.S.', 'Názov: elektrika'],
    };
    expect(getTransactionLines(tx)).toEqual([
      'SK11 0200 0000 2700 0210 7012',
      'ZSE ENERGIA, A.S.',
      'Názov: elektrika',
    ]);
  });

  it('should build details from popis and account when details missing', () => {
    const tx: TransactionType = {
      ...baseTx,
      popis: 'ZSE ENERGIA, A.S. - elektrika',
      account: 'SK1102000000270002107012',
      vs: '6310319204',
    };
    const lines = buildTransactionDetails(tx);
    expect(lines[0]).toContain('SK11 0200');
    expect(lines.some((l) => l.includes('ZSE ENERGIA'))).toBe(true);
    expect(lines.some((l) => l.startsWith('BIC:'))).toBe(true);
    expect(lines.some((l) => l.includes('Referencia platiteľa'))).toBe(true);
  });

  it('should render col4 from vs and bank_ref', () => {
    expect(getTransactionCol4Lines({ ...baseTx, vs: '123', bank_ref: 'REF001' })).toEqual(['123', 'REF001']);
    expect(getTransactionCol4Lines({ ...baseTx, bank_ref: 'REF002' })).toEqual(['', 'REF002']);
  });

  it('should resolve fee_type from field or is_fee flag', () => {
    expect(getTransactionCol7Value({ ...baseTx, fee_type: 'L' })).toBe('L');
    expect(getTransactionCol7Value({ ...baseTx, is_fee: true })).toBe('I');
    expect(getTransactionCol7Value(baseTx)).toBe('');
  });
});