import { describe, it, expect } from 'vitest';
import {
  formatIbanWithSpaces,
  getBicFromIban,
  getPayerRef,
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

describe('transactionRender helpers', () => {
  describe('formatIbanWithSpaces', () => {
    it('should return empty for missing iban', () => {
      expect(formatIbanWithSpaces()).toBe('');
      expect(formatIbanWithSpaces('')).toBe('');
    });

    it('should group iban into blocks of 4', () => {
      expect(formatIbanWithSpaces('SK1102000000270002107012')).toBe('SK11 0200 0000 2700 0210 7012');
      expect(formatIbanWithSpaces('SK11 0200 0000 2700 0210 7012')).toBe('SK11 0200 0000 2700 0210 7012');
    });
  });

  describe('getBicFromIban', () => {
    it('should resolve known slovak bank codes', () => {
      expect(getBicFromIban('SK1102000000270002107012')).toBe('SUBASKBX');
      expect(getBicFromIban('SK6565000000000000000000')).toBe('POBNSKBA');
    });

    it('should return empty for unknown or short iban', () => {
      expect(getBicFromIban('SK999999999999999999')).toBe('');
      expect(getBicFromIban()).toBe('');
    });
  });

  describe('getPayerRef', () => {
    it('should return empty when all symbols undefined', () => {
      expect(getPayerRef({})).toBe('');
    });

    it('should return Neuvedené when symbols present but empty', () => {
      expect(getPayerRef({ vs: '', ks: '', ss: '' })).toBe('Neuvedené');
    });

    it('should return empty when vs defined alone as empty string', () => {
      expect(getPayerRef({ vs: '' })).toBe('Neuvedené');
    });

    it('should format VS/SS/KS reference string', () => {
      expect(getPayerRef({ vs: '123', ks: '0308', ss: '9' })).toBe('/VS123/SS9/KS0308');
    });
  });
});

describe('transactionRender PDF columns', () => {
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

  it('should filter blank lines from details array', () => {
    const tx: TransactionType = {
      ...baseTx,
      details: ['ok', '  ', ''],
    };
    expect(getTransactionLines(tx)).toEqual(['ok']);
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

  it('should split multiline popis into separate lines', () => {
    const tx: TransactionType = {
      ...baseTx,
      popis: 'Riadok A\nRiadok B',
    };
    const lines = buildTransactionDetails(tx);
    expect(lines).toContain('Riadok A');
    expect(lines).toContain('Riadok B');
  });

  it('should fall back to empty popis line', () => {
    expect(getTransactionLines(baseTx)).toEqual(['']);
  });

  it('should render col4 from vs and bank_ref combinations', () => {
    expect(getTransactionCol4Lines({ ...baseTx, vs: '123', bank_ref: 'REF001' })).toEqual(['123', 'REF001']);
    expect(getTransactionCol4Lines({ ...baseTx, bank_ref: 'REF002' })).toEqual(['', 'REF002']);
    expect(getTransactionCol4Lines({ ...baseTx, vs: '456' })).toEqual(['456']);
    expect(getTransactionCol4Lines(baseTx)).toEqual(['']);
  });

  it('should resolve fee_type from field or is_fee flag', () => {
    expect(getTransactionCol7Value({ ...baseTx, fee_type: 'L' })).toBe('L');
    expect(getTransactionCol7Value({ ...baseTx, is_fee: true })).toBe('I');
    expect(getTransactionCol7Value(baseTx)).toBe('');
  });

  it('should not duplicate BIC or payer ref when already in popis', () => {
    const tx: TransactionType = {
      ...baseTx,
      popis: 'BIC: SUBASKBX\nReferencia platiteľa: /VS1/SS/KS',
      account: 'SK1102000000270002107012',
      vs: '1',
    };
    const lines = buildTransactionDetails(tx);
    expect(lines.filter((l) => l.startsWith('BIC:')).length).toBe(1);
    expect(lines.filter((l) => l.includes('Referencia platiteľa')).length).toBe(1);
  });
});