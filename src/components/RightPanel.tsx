import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { PDFViewer } from '@react-pdf/renderer';
import { useAppStore } from '../store/useAppStore';
import { StatementDocument } from '../pdf/StatementDocument';
import InspectorPanel from '../editor/InspectorPanel';
import { checkMemoryBeforeExport, downloadStatementsZip } from '../export/zipExport';

export { StatementDocument } from '../pdf/StatementDocument';

export default function RightPanel() {
  const sourceOfTruth = useAppStore(state => state.sourceOfTruth, shallow);
  const batchMode = useAppStore(state => state.batchMode);
  const batchStatements = useAppStore(state => state.batchStatements, shallow);
  const selectedBatchIndex = useAppStore(state => state.selectedBatchIndex);
  const setSelectedBatchIndex = useAppStore(state => state.setSelectedBatchIndex);

  const [showInspector, setShowInspector] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  const handleDownloadZip = async () => {
    if (batchStatements.length === 0) return;
    if (!checkMemoryBeforeExport(batchStatements.length)) return;

    setExportingZip(true);
    setZipProgress('Inicializácia...');
    try {
      await downloadStatementsZip(batchStatements, setZipProgress);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Chyba pri generovaní ZIP archívu. Skúste zmeniť počet mesiacov alebo zreštartujte aplikáciu.');
    } finally {
      setExportingZip(false);
      setZipProgress('');
    }
  };

  const pdfKey = `${sourceOfTruth.statement.statement_month}-${sourceOfTruth.statement.statement_year}-${sourceOfTruth.balances.opening_balance}-${sourceOfTruth.balances.closing_balance}`;

  return (
    <div className="ft-right">
      <div className="ft-right-bg" />
      <div className="ft-preview-header">
        <div className="ft-preview-label">
          <span className="ft-preview-dot" />
          Live PDF Preview
        </div>
        <button
          type="button"
          className={`ft-preview-toggle-btn ${showInspector ? 'active' : ''}`}
          onClick={() => setShowInspector((v) => !v)}
        >
          {showInspector ? 'Skryť Inspector' : 'Inspector'}
        </button>
      </div>

      {batchMode && batchStatements.length > 0 && (
        <div className="ft-batch-bar">
          <div className="ft-batch-bar-top">
            <span className="ft-batch-label">
              Vygenerované výpisy ({batchStatements.length} mesiacov)
              {zipProgress && <span className="ft-batch-progress">({zipProgress})</span>}
            </span>
            <button
              type="button"
              className="ft-btn ft-btn-primary ft-btn-sm"
              onClick={handleDownloadZip}
              disabled={exportingZip}
            >
              {exportingZip ? 'Exportujem...' : 'Exportovať všetky do ZIP'}
            </button>
          </div>
          <div className="ft-batch-timeline">
            {batchStatements.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className={`ft-btn ${selectedBatchIndex === idx ? 'ft-btn-primary' : 'ft-btn-ghost'} ft-btn-sm ft-batch-chip`}
                onClick={() => setSelectedBatchIndex(idx)}
              >
                <span>{s.statement.statement_month}/{s.statement.statement_year}</span>
                <span className="ft-batch-balance">({s.balances.closing_balance.toFixed(2)} €)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`ft-preview-body ${showInspector ? 'ft-preview-split' : ''}`}>
        <PDFViewer key={pdfKey} className="ft-pdf-viewer">
          <StatementDocument sourceOfTruth={sourceOfTruth} />
        </PDFViewer>
        {showInspector && (
          <aside className="ft-inspector-panel">
            <InspectorPanel />
          </aside>
        )}
      </div>
    </div>
  );
}