import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import React from 'react';
import { StatementDocument } from '../pdf/StatementDocument';
import type { SourceOfTruthType } from '../schema/sourceOfTruth';

const BATCH_SIZE = 3;

export function checkMemoryBeforeExport(statementCount: number): boolean {
  if (typeof window === 'undefined') return true;

  const estimatedMemory = statementCount * 5 * 1.5;

  // @ts-expect-error performance.memory is non-standard
  if (window.performance?.memory) {
    // @ts-expect-error performance.memory is non-standard
    const availableMB = window.performance.memory.jsHeapSizeLimit / 1024 / 1024;
    if (estimatedMemory > availableMB * 0.7) {
      alert(`Varovanie: Nedostatok pamäte! Odporúča sa generovať max. ${Math.floor(availableMB * 0.7 / 7.5)} výpisov naraz.`);
      return false;
    }
  }

  if (statementCount > 24) {
    return confirm(`Varovanie: Generujete ${statementCount} výpisov. Odporúča sa max. 12 naraz. Pokračovať?`);
  }

  return true;
}

export async function downloadStatementsZip(
  statements: SourceOfTruthType[],
  onProgress?: (message: string) => void,
): Promise<void> {
  if (statements.length === 0) return;

  const zip = new JSZip();
  const total = statements.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = statements.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      chunk.map(async (s, idxInChunk) => {
        const absoluteIdx = i + idxInChunk;
        onProgress?.(`Generujem ${absoluteIdx + 1}/${total}`);

        const blob = await pdf(
          React.createElement(StatementDocument, { sourceOfTruth: s }) as React.ReactElement,
        ).toBlob();
        const safeName = s.statement.statement_number?.replace(/\//g, '_') || `vypis_${absoluteIdx + 1}`;

        return { name: `Vypis_${safeName}.pdf`, blob };
      }),
    );

    results.forEach(({ name, blob }) => {
      zip.file(name, blob, { binary: true });
    });
  }

  onProgress?.('Komprimujem...');
  const content = await zip.generateAsync({
    type: 'blob',
    streamFiles: true,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  saveAs(content, `VUB_Vypisy_Batch_${total}_mesiacov.zip`);
}