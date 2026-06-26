import { describe, it, expect, beforeAll } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore - cascadeBalances Memory and Performance Profiling', () => {
  beforeAll(() => {
    // Reset store state
    useAppStore.setState({
      batchMode: false,
      batchStatements: [],
      selectedBatchIndex: 0,
    });
  });

  it('should run memory audit on cascadeBalances with varying batch sizes', () => {
    const memorySnapshots: Array<{ size: number; durationMs: number; memoryDeltaMb: number }> = [];

    // Test with 12, 60, and 240 months (representing 1, 5, and 20 years of data)
    const batchSizes = [12, 60, 240];

    batchSizes.forEach((size) => {
      // 1. Setup the batch settings
      useAppStore.getState().setBatchSettings({
        startMonth: '01',
        startYear: '2025',
        numberOfMonths: size,
        initialOpeningBalance: 1000.0,
        recurringTransactions: [
          { description: 'Salary', amount: 2500.0, day: 15 },
          { description: 'Rent', amount: -650.0, day: 2 },
          { description: 'Groceries', amount: -75.0, day: 10 },
        ],
      });

      // Enable batchMode and generate initial batch
      useAppStore.getState().setBatchMode(true);
      
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      useAppStore.getState().generateBatch();
      
      // Cascade multiple times to simulate heavy modifications
      for (let i = 0; i < 5; i++) {
        useAppStore.getState().cascadeBalances();
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const durationMs = endTime - startTime;
      const memoryDeltaMb = (endMemory - startMemory) / 1024 / 1024;

      memorySnapshots.push({
        size,
        durationMs,
        memoryDeltaMb,
      });

      // Expectations
      expect(useAppStore.getState().batchStatements.length).toBe(size);
      
      // The first statement should keep its initial opening balance
      expect(useAppStore.getState().batchStatements[0].balances.opening_balance).toBe(1000.0);
      
      // Performance check: cascading 240 statements should run fast (< 200ms)
      if (size === 240) {
        expect(durationMs).toBeLessThan(200);
      }
    });

    console.table(memorySnapshots);
  });

  it('should verify memory leak absence under repeated store mutations and cascades', () => {
    // Generate a fixed size batch
    useAppStore.getState().setBatchSettings({
      startMonth: '01',
      startYear: '2025',
      numberOfMonths: 50,
      initialOpeningBalance: 1500.0,
      recurringTransactions: [{ description: 'Base Tx', amount: -50.0, day: 5 }],
    });
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    // Baseline memory
    if (global.gc) {
      global.gc();
    }
    const baselineHeap = process.memoryUsage().heapUsed;

    // Run 500 balance cascades with store state edits
    for (let i = 0; i < 500; i++) {
      // Modify first month's transaction list slightly
      const currentTransactions = [...useAppStore.getState().batchStatements[0].transactions];
      currentTransactions.push({
        date_realiz: '05.01.2025',
        date_valuta: '05.01.2025',
        amount: -10.0 - i,
        popis: `Benchmark transaction ${i}`,
        account: 'SK120000000000000000',
      });
      
      useAppStore.setState((state) => {
        const updatedBatch = [...state.batchStatements];
        updatedBatch[0] = {
          ...updatedBatch[0],
          transactions: currentTransactions,
        };
        return { batchStatements: updatedBatch };
      });

      // Run cascade
      useAppStore.getState().cascadeBalances();
    }

    if (global.gc) {
      global.gc();
    }
    const finalHeap = process.memoryUsage().heapUsed;
    const growthMb = (finalHeap - baselineHeap) / 1024 / 1024;

    console.log(`Memory growth after 500 cycles of 50-month cascades: ${growthMb.toFixed(2)} MB`);
    
    // Memory growth should be minimal (< 15 MB threshold for V8 garbage collector breathing room)
    expect(growthMb).toBeLessThan(15);
  });

  it('should confirm store objects have no circular references', () => {
    const state = useAppStore.getState();
    
    const checkCircular = (obj: any, seen = new WeakSet()): boolean => {
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) {
          return true; // Circular reference detected
        }
        seen.add(obj);
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (checkCircular(obj[key], seen)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Audit full store
    const hasCircular = checkCircular(state.sourceOfTruth) || checkCircular(state.batchStatements);
    expect(hasCircular).toBe(false);
  });
});
