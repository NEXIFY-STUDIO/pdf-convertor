import { describe, it, expect, beforeEach } from 'vitest';
import type { TransactionType } from '../schema/sourceOfTruth';
import { useAppStore } from '../store/useAppStore';
import {
  buildKolomanovMlynBatch,
  KOLOMANOV_MLYN_CLIENT,
  SLSP_BANK,
  TARGET_CLOSING_BALANCES,
  TARGET_MONTHLY_CREDITS,
  MAX_PAYMENTS_PER_STATEMENT,
} from '../presets/kolomanovMlynSlspPreset';
import { COMPACT_STATEMENT_MAX_TX } from '../pdf/StatementDocument';

describe('Magic Wand — Kolomanov Mlyn SLSP preset', () => {
  beforeEach(() => {
    useAppStore.setState({
      batchMode: false,
      batchStatements: [],
      selectedBatchIndex: 0,
    });
  });

  it('should use Kolomanov Mlyn company data from IČO 57194050', () => {
    expect(KOLOMANOV_MLYN_CLIENT.client_id).toBe('57194050');
    expect(KOLOMANOV_MLYN_CLIENT.client_title).toContain('KOLOMANOV MLYN');
    expect(KOLOMANOV_MLYN_CLIENT.client_street).toContain('JENISEJSKÁ');
    expect(KOLOMANOV_MLYN_CLIENT.client_zip).toBe('040 12');
    expect(KOLOMANOV_MLYN_CLIENT.client_city).toContain('KOŠICE');
  });

  it('should build 3 statements with credit turnover 50k–54k (with cents, not round)', () => {
    const batch = buildKolomanovMlynBatch();
    expect(batch).toHaveLength(3);

    batch.forEach((stmt, idx) => {
      const credit = stmt.balances.total_credit;
      expect(credit).toBeGreaterThanOrEqual(50_000);
      expect(credit).toBeLessThanOrEqual(54_000);
      expect(credit).toBeCloseTo(TARGET_MONTHLY_CREDITS[idx], 2);
      expect(credit % 1).not.toBe(0);
    });
  });

  it('should have max 10 payments per statement for 2-page PDF', () => {
    const batch = buildKolomanovMlynBatch();
    batch.forEach((stmt) => {
      expect(stmt.transactions.length).toBeLessThanOrEqual(MAX_PAYMENTS_PER_STATEMENT);
      expect(stmt.transactions.length).toBeLessThanOrEqual(COMPACT_STATEMENT_MAX_TX);
      expect(stmt.transactions.length).toBe(10);
    });
  });

  it('should end each month with exact target closing balances', () => {
    const batch = buildKolomanovMlynBatch();
    batch.forEach((stmt, idx) => {
      expect(stmt.balances.closing_balance).toBeCloseTo(TARGET_CLOSING_BALANCES[idx], 2);
    });
    expect(batch[0].balances.closing_balance).toBeCloseTo(6545.4, 2);
    expect(batch[1].balances.closing_balance).toBeCloseTo(4444.5, 2);
    expect(batch[2].balances.closing_balance).toBeCloseTo(5909.9, 2);
  });

  it('should cascade opening balances across months', () => {
    const batch = buildKolomanovMlynBatch();
    expect(batch[1].balances.opening_balance).toBeCloseTo(batch[0].balances.closing_balance, 2);
    expect(batch[2].balances.opening_balance).toBeCloseTo(batch[1].balances.closing_balance, 2);
  });

  it('should use different transaction patterns per month', () => {
    const hasCounterparty = (txs: TransactionType[], needle: string) =>
      txs.some(
        (t) =>
          t.popis?.includes(needle) ||
          t.details?.some((d) => d.includes(needle)),
      );

    const batch = buildKolomanovMlynBatch();
    expect(hasCounterparty(batch[0].transactions, 'vintrica')).toBe(true);
    expect(hasCounterparty(batch[1].transactions, 'LogiCall')).toBe(true);
    expect(hasCounterparty(batch[2].transactions, 'FinStat')).toBe(true);
  });

  it('applyMagicWandPreset should enable batch mode and load all data', () => {
    const { aiPrompt } = useAppStore.getState().applyMagicWandPreset();
    const state = useAppStore.getState();

    expect(state.batchMode).toBe(true);
    expect(state.batchStatements).toHaveLength(3);
    expect(state.batchSettings.startMonth).toBe('04');
    expect(state.sourceOfTruth.client.client_id).toBe('57194050');
    expect(state.sourceOfTruth.bank.bank_logo_id).toBe(SLSP_BANK.bank_logo_id);
    expect(aiPrompt).toContain('51 234,67');
  });
});