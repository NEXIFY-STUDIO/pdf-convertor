import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Papa from 'papaparse';
import { TransactionType } from '../schema/sourceOfTruth';
import { normalizeTransactions } from '../shared/normalizeTransaction';
import { pdf } from '@react-pdf/renderer';
import { StatementDocument } from '../pdf/StatementDocument';
import { parseStatementWithAI } from '../lib/mistralClient';

async function downloadStatementPdf(sourceOfTruth: any): Promise<void> {
  const blob = await pdf(<StatementDocument sourceOfTruth={sourceOfTruth} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = sourceOfTruth.statement.statement_number?.replace(/\//g, '_') || 'export';
  link.download = `Vypis_${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Clean up object URL to prevent memory leaks
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

export default function LeftPanel() {
  const {  
    sourceOfTruth,
    setBankData, 
    setClientData, 
    setStatementData, 
    setOpeningBalance, 
    setTransactions,
    mistralApiKey,
    setMistralApiKey,
    
    // Batch Mode variables & actions
    batchMode,
    batchSettings,
    setBatchMode,
    setBatchSettings,
    generateBatch,
    applyMagicWandPreset,
  } = useAppStore();

  const { bank, client, statement, balances, transactions } = sourceOfTruth;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // AI Import State
  const [rawText, setRawText] = useState('');
  const [aiModel, setAiModel] = useState('mistral-large-latest');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [wandSuccess, setWandSuccess] = useState(false);

  const handleMagicWand = () => {
    const { aiPrompt } = applyMagicWandPreset();
    setRawText(aiPrompt);
    setWandSuccess(true);
    setAiError(null);
    setTimeout(() => setWandSuccess(false), 4000);
  };

  const handleAiParse = async () => {
    if (!rawText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(false);
    try {
      const result = await parseStatementWithAI(rawText, mistralApiKey, aiModel);
      
      if (result.bank) setBankData(result.bank);
      if (result.client) setClientData(result.client);
      if (result.statement) setStatementData(result.statement);
      if (result.balances) {
        setOpeningBalance(result.balances.opening_balance ?? 0);
      }
      if (Array.isArray(result.transactions)) {
        setTransactions(mapJsonTransactions(result.transactions));
      }
      
      setAiSuccess(true);
      setRawText('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Chyba pri analýze výpisu.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadStatementPdf(sourceOfTruth);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfError('Chyba pri generovaní PDF. Skúste znova.');
    } finally {
      setPdfLoading(false);
    }
  };

  const mapJsonTransactions = (rows: unknown[]): TransactionType[] => normalizeTransactions(rows);

  const handleFileUpload = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data.bank) setBankData(data.bank);
            if (data.client) setClientData(data.client);
            if (data.statement) setStatementData(data.statement);
            if (data.balances) {
              setOpeningBalance(data.balances.opening_balance || 0);
            }
            if (Array.isArray(data.transactions)) {
              setTransactions(mapJsonTransactions(data.transactions));
            }
          } else if (Array.isArray(data)) {
            setTransactions([...transactions, ...mapJsonTransactions(data)]);
          }
        } catch (err) {
          console.error('Failed to parse JSON file:', err);
          setPdfError('Chyba pri čítaní JSON súboru.');
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const parsedTransactions = mapJsonTransactions(results.data);
          setTransactions([...transactions, ...parsedTransactions]);
        }
      });
    }
  };

  // Batch specific handlers
  const updateRecurring = (idx: number, updatedItem: Partial<typeof batchSettings.recurringTransactions[0]>) => {
    const updated = [...batchSettings.recurringTransactions];
    updated[idx] = { ...updated[idx], ...updatedItem };
    setBatchSettings({ recurringTransactions: updated });
  };

  const addRecurring = () => {
    setBatchSettings({
      recurringTransactions: [
        ...batchSettings.recurringTransactions,
        { description: 'Nová transakcia', amount: 100, day: 15 }
      ]
    });
  };

  const removeRecurring = (idx: number) => {
    setBatchSettings({
      recurringTransactions: batchSettings.recurringTransactions.filter((_, i) => i !== idx)
    });
  };

  return (
    <aside className="ft-left">

      {/* Magic Wand — Kolomanov Mlyn SLSP preset */}
      <button
        type="button"
        className="ft-btn ft-btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          border: 'none',
          gap: '6px',
        }}
        onClick={handleMagicWand}
        title="Kolomanov Mlyn IČO 57194050 — 3× výpis (max 10 platieb, 2 strany PDF, obrat 50–54 tis. €)"
      >
        <span aria-hidden="true">🪄</span>
        Magická palička — Kolomanov Mlyn
      </button>
      {wandSuccess && (
        <div style={{ margin: '-0.75rem 0 1rem', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 'bold' }}>
          ✓ 04–06/2026 · 10 platieb/2 strany · obrat 51–54 tis. € · zostatky 6 545 / 4 444 / 5 909 €
        </div>
      )}

      {/* Mode Toggle Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <button 
          className={`ft-btn ${!batchMode ? 'ft-btn-primary' : 'ft-btn-ghost'}`} 
          style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', justifyContent: 'center' }}
          onClick={() => setBatchMode(false)}
        >
          Jeden výpis
        </button>
        <button 
          className={`ft-btn ${batchMode ? 'ft-btn-primary' : 'ft-btn-ghost'}`} 
          style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', justifyContent: 'center' }}
          onClick={() => setBatchMode(true)}
        >
          Dávkový generátor
        </button>
      </div>

      {!batchMode ? (
        <>
          {/* ── AI Import (Mistral) ── */}
          <div className="ft-section-label">AI Import (Mistral)</div>
          <div className="ft-card">
            <div className="ft-card-title" style={{ marginBottom: '0.625rem' }}>Automatický import cez LLM</div>
            
            <div className="ft-field" style={{ marginBottom: '0.625rem' }}>
              <label className="ft-label" htmlFor="mistral-key">Mistral API Kľúč</label>
              <input
                id="mistral-key"
                className="ft-input"
                type="password"
                value={mistralApiKey}
                onChange={(e) => setMistralApiKey(e.target.value)}
                placeholder="Zadajte API kľúč..."
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="ft-field" style={{ marginBottom: '0.625rem' }}>
              <label className="ft-label" htmlFor="mistral-raw-text">Surový text výpisu</label>
              <textarea
                id="mistral-raw-text"
                className="ft-input"
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Sem skopírujte text z internet bankingu alebo PDF výpisu..."
                style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'var(--font-sans)' }}
              />
            </div>

            <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
              <div className="ft-field">
                <label className="ft-label" htmlFor="mistral-model">Model</label>
                <select
                  id="mistral-model"
                  className="ft-input"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  style={{ padding: '0 0.5rem', height: '1.875rem' }}
                >
                  <option value="mistral-large-latest">mistral-large-latest (Odporúčaný)</option>
                  <option value="open-mistral-nemo">open-mistral-nemo (Rýchly)</option>
                  <option value="mistral-small-latest">mistral-small-latest</option>
                </select>
              </div>
            </div>

            <button
              className="ft-btn ft-btn-primary ft-btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.3125rem' }}
              onClick={handleAiParse}
              disabled={aiLoading || !rawText}
            >
              {aiLoading ? <><span className="ft-spinner" /> Spracovávam...</> : 'Analyzovať cez AI'}
            </button>

            {aiError && (
              <div className="ft-error-msg" style={{ marginTop: '0.5rem', color: 'var(--color-error)' }}>
                {aiError}
              </div>
            )}
            {aiSuccess && (
              <div style={{ marginTop: '0.5rem', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ✓ Výpis bol úspešne naimportovaný!
              </div>
            )}
          </div>

          {/* ── Statement Params ── */}
          <div className="ft-section-label">Výpis</div>
          <div className="ft-card">
            <div className="ft-card-title">Parametre výpisu</div>
            <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
              <div className="ft-field">
                <label className="ft-label" htmlFor="statement-title">Názov dokumentu</label>
                <input
                  id="statement-title"
                  className="ft-input"
                  value={statement.statement_title || ''}
                  onChange={(e) => setStatementData({ statement_title: e.target.value })}
                  placeholder="VÝPIS Z ÚČTU"
                />
              </div>
              <div className="ft-field" style={{ flex: '0 0 110px' }}>
                <label className="ft-label" htmlFor="statement-number">Číslo výpisu</label>
                <input
                  id="statement-number"
                  className="ft-input"
                  value={statement.statement_number}
                  onChange={(e) => setStatementData({ statement_number: e.target.value })}
                  placeholder="11/2025"
                />
              </div>
            </div>
            <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
              <div className="ft-field">
                <label className="ft-label" htmlFor="period-start">Obdobie Od</label>
                <input
                  id="period-start"
                  className="ft-input"
                  value={statement.period_start}
                  onChange={(e) => setStatementData({ period_start: e.target.value })}
                  placeholder="01.11.2025"
                />
              </div>
              <div className="ft-field">
                <label className="ft-label" htmlFor="period-end">Obdobie Do</label>
                <input
                  id="period-end"
                  className="ft-input"
                  value={statement.period_end}
                  onChange={(e) => setStatementData({ period_end: e.target.value })}
                  placeholder="30.11.2025"
                />
              </div>
            </div>
            <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
              <div className="ft-field">
                <label className="ft-label" htmlFor="statement-date">Zo dňa</label>
                <input
                  id="statement-date"
                  className="ft-input"
                  value={statement.statement_date || ''}
                  onChange={(e) => setStatementData({ statement_date: e.target.value })}
                  placeholder="30.11.2025"
                />
              </div>
              <div className="ft-field" style={{ flex: '0 0 80px' }}>
                <label className="ft-label" htmlFor="statement-currency">Mena</label>
                <input
                  id="statement-currency"
                  className="ft-input"
                  value={statement.statement_currency || ''}
                  onChange={(e) => setStatementData({ statement_currency: e.target.value })}
                  placeholder="EUR"
                />
              </div>
            </div>
            <div className="ft-input-grid">
              <div className="ft-field">
                <label className="ft-label" htmlFor="statement-frequency">Frekvencia výpisov</label>
                <input
                  id="statement-frequency"
                  className="ft-input"
                  value={statement.statement_frequency || ''}
                  onChange={(e) => setStatementData({ statement_frequency: e.target.value })}
                  placeholder="mesačne"
                />
              </div>
              <div className="ft-field">
                <label className="ft-label" htmlFor="opening-balance">Počiatočný zostatok (€)</label>
                <input
                  id="opening-balance"
                  className="ft-input"
                  type="number"
                  value={balances.opening_balance}
                  onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          {/* ── Transactions ── */}
          <div className="ft-section-label">Transakcie</div>
          <div className="ft-card">
            <div className="ft-tx-header">
              <div className="ft-tx-title">
                Transakcie
                <span className="ft-tx-count">{transactions.length}</span>
              </div>
              <div>
                <input
                  type="file"
                  accept=".csv,.json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  className="ft-btn ft-btn-ghost ft-btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Importovať dáta (CSV / JSON)
                </button>
              </div>
            </div>

            <div className="ft-tx-list">
              {transactions.length === 0 ? (
                <div className="ft-tx-empty">
                  Zatiaľ žiadne transakcie.<br />Nahrajte CSV alebo JSON súbor.
                </div>
              ) : (
                transactions.map((t: TransactionType, idx: number) => (
                  <div key={idx} className="ft-tx-row">
                    <span className="ft-tx-date">{t.date_realiz}</span>
                    <span className="ft-tx-desc">{t.popis}</span>
                    <span className={`ft-tx-amount ${t.amount >= 0 ? 'credit' : 'debit'}`}>
                      {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)} €
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Calculations ── */}
          <div className="ft-section-label">Zostatky</div>
          <div className="ft-card">
            <div className="ft-card-title">Automatické výpočty</div>

            <div className="ft-money-grid">
              <div className="ft-money-item">
                <div className="ft-money-label">Celkový kredit</div>
                <div className="ft-money-value credit">+{balances.total_credit.toFixed(2)} €</div>
              </div>
              <div className="ft-money-item">
                <div className="ft-money-label">Celkový debet</div>
                <div className="ft-money-value debit">−{balances.total_debit.toFixed(2)} €</div>
              </div>
            </div>

            <div className="ft-money-closing">
              <div className="ft-money-closing-label">Konečný zostatok</div>
              <div className="ft-money-closing-value">{balances.closing_balance.toFixed(2)} €</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Batch Generator configuration card ── */}
          <div className="ft-section-label">Batch Nastavenia</div>
          <div className="ft-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="ft-card-title">Parametre časovej osi</div>
            
            <div className="ft-input-grid">
              <div className="ft-field">
                <label className="ft-label" htmlFor="batch-start-month">Počiatočný mesiac</label>
                <select
                  id="batch-start-month"
                  className="ft-input"
                  value={batchSettings.startMonth}
                  onChange={(e) => setBatchSettings({ startMonth: e.target.value })}
                  style={{ padding: '0 0.5rem', height: '1.875rem' }}
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="ft-field">
                <label className="ft-label" htmlFor="batch-start-year">Počiatočný rok</label>
                <input
                  id="batch-start-year"
                  className="ft-input"
                  type="number"
                  value={batchSettings.startYear}
                  onChange={(e) => setBatchSettings({ startYear: e.target.value })}
                  placeholder="2025"
                />
              </div>
            </div>

            <div className="ft-input-grid">
              <div className="ft-field">
                <label className="ft-label" htmlFor="batch-count">Počet mesiacov</label>
                <input
                  id="batch-count"
                  className="ft-input"
                  type="number"
                  min={1}
                  max={60}
                  value={batchSettings.numberOfMonths}
                  onChange={(e) => setBatchSettings({ numberOfMonths: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="ft-field">
                <label className="ft-label" htmlFor="batch-initial-balance">Počiat. zostatok (€)</label>
                <input
                  id="batch-initial-balance"
                  className="ft-input"
                  type="number"
                  value={batchSettings.initialOpeningBalance}
                  onChange={(e) => setBatchSettings({ initialOpeningBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="1000.00"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Recurring transactions builder */}
            <div style={{ marginTop: '0.5rem' }}>
              <div className="ft-label" style={{ marginBottom: '0.4rem', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>
                Opakujúce sa transakcie
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px', marginBottom: '0.5rem' }}>
                {batchSettings.recurringTransactions.map((rec, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px auto', gap: '6px', alignItems: 'center' }}>
                    <input
                      className="ft-input"
                      style={{ padding: '4px 6px', fontSize: '0.75rem', height: '1.875rem' }}
                      value={rec.description}
                      onChange={(e) => updateRecurring(idx, { description: e.target.value })}
                      placeholder="Popis"
                    />
                    <input
                      className="ft-input"
                      style={{ padding: '4px 6px', fontSize: '0.75rem', height: '1.875rem', fontFamily: 'var(--font-mono)' }}
                      type="number"
                      value={rec.amount}
                      onChange={(e) => updateRecurring(idx, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="Suma"
                    />
                    <input
                      className="ft-input"
                      style={{ padding: '4px 6px', fontSize: '0.75rem', height: '1.875rem', fontFamily: 'var(--font-mono)' }}
                      type="number"
                      min={1}
                      max={31}
                      value={rec.day}
                      onChange={(e) => updateRecurring(idx, { day: parseInt(e.target.value) || 1 })}
                      placeholder="Deň"
                    />
                    <button
                      className="ft-btn ft-btn-ghost"
                      style={{ padding: '0', width: '1.875rem', height: '1.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                      onClick={() => removeRecurring(idx)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="ft-btn ft-btn-ghost ft-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={addRecurring}
                type="button"
              >
                + Pridať transakciu
              </button>
            </div>

            <button
              className="ft-btn ft-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={generateBatch}
              type="button"
            >
              Generovať dávku
            </button>
          </div>
        </>
      )}

      {/* ── Bank Data (Common) ── */}
      <div className="ft-section-label">Banka</div>
      <div className="ft-card">
        <div className="ft-card-title">Údaje banky</div>
        <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
          <div className="ft-field">
            <label className="ft-label" htmlFor="bank-logo-id">Názov banky / Skupina</label>
            <input
              id="bank-logo-id"
              className="ft-input"
              value={bank?.bank_logo_id || ''}
              onChange={(e) => setBankData({ bank_logo_id: e.target.value })}
              placeholder="VÚB BANKA Intesa Sanpaolo Group"
            />
          </div>
          <div className="ft-field">
            <label className="ft-label" htmlFor="bank-outlet-id">Kód pobočky</label>
            <input
              id="bank-outlet-id"
              className="ft-input"
              value={bank?.bank_outlet_id || ''}
              onChange={(e) => setBankData({ bank_outlet_id: e.target.value })}
              placeholder="30017"
            />
          </div>
        </div>
        <div className="ft-field" style={{ marginBottom: '0.625rem' }}>
          <label className="ft-label" htmlFor="bank-outlet-address">Adresa pobočky</label>
          <input
            id="bank-outlet-address"
            className="ft-input"
            value={bank?.bank_outlet_address || ''}
            onChange={(e) => setBankData({ bank_outlet_address: e.target.value })}
            placeholder="KOMÁRNICKÁ 11, BRATISLAVA"
          />
        </div>
        <div className="ft-field">
          <label className="ft-label" htmlFor="bank-register-info">Registračné informácie</label>
          <textarea
            id="bank-register-info"
            className="ft-input"
            rows={2}
            value={bank?.bank_register_info || ''}
            onChange={(e) => setBankData({ bank_register_info: e.target.value })}
            placeholder="VÚB, a.s., Mlynské nivy 1..."
            style={{ resize: 'vertical', minHeight: '44px', fontFamily: 'var(--font-sans)' }}
          />
        </div>
      </div>

      {/* ── Client Data (Common) ── */}
      <div className="ft-section-label">Klient</div>
      <div className="ft-card">
        <div className="ft-card-title">Údaje klienta</div>
        <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-title">Názov spoločnosti / Meno</label>
            <input
              id="client-title"
              className="ft-input"
              value={client.client_title}
              onChange={(e) => setClientData({ client_title: e.target.value })}
              placeholder="ACME, s.r.o."
            />
          </div>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-id">IČO klienta</label>
            <input
              id="client-id"
              className="ft-input"
              value={client.client_id || ''}
              onChange={(e) => setClientData({ client_id: e.target.value })}
              placeholder="36821608"
            />
          </div>
        </div>
        <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-street">Ulica</label>
            <input
              id="client-street"
              className="ft-input"
              value={client.client_street}
              onChange={(e) => setClientData({ client_street: e.target.value })}
              placeholder="Vilová 31"
            />
          </div>
          <div className="ft-field" style={{ flex: '0 0 80px' }}>
            <label className="ft-label" htmlFor="client-zip">PSČ</label>
            <input
              id="client-zip"
              className="ft-input"
              value={client.client_zip}
              onChange={(e) => setClientData({ client_zip: e.target.value })}
              placeholder="851 01"
            />
          </div>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-city">Mesto</label>
            <input
              id="client-city"
              className="ft-input"
              value={client.client_city}
              onChange={(e) => setClientData({ client_city: e.target.value })}
              placeholder="Bratislava"
            />
          </div>
        </div>
        <div className="ft-input-grid" style={{ marginBottom: '0.625rem' }}>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-iban">IBAN</label>
            <input
              id="client-iban"
              className="ft-input"
              value={client.client_iban}
              onChange={(e) => setClientData({ client_iban: e.target.value })}
              placeholder="SK00 0000 0000 0000 0000"
            />
          </div>
          <div className="ft-field" style={{ flex: '0 0 110px' }}>
            <label className="ft-label" htmlFor="client-swift">SWIFT / BIC</label>
            <input
              id="client-swift"
              className="ft-input"
              value={client.client_swift}
              onChange={(e) => setClientData({ client_swift: e.target.value })}
              placeholder="SUBASKBX"
            />
          </div>
        </div>
        <div className="ft-input-grid">
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-account">Typ účtu</label>
            <input
              id="client-account"
              className="ft-input"
              value={client.client_account || ''}
              onChange={(e) => setClientData({ client_account: e.target.value })}
              placeholder="VÚB Biznis účet Štandard"
            />
          </div>
          <div className="ft-field">
            <label className="ft-label" htmlFor="client-limit">Limit prečerpania</label>
            <input
              id="client-limit"
              className="ft-input"
              value={client.client_limit || ''}
              onChange={(e) => setClientData({ client_limit: e.target.value })}
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="ft-export-card">
        <div className="ft-export-row">
          <div className="ft-export-info">
            <div className="ft-export-title">
              {batchMode ? 'Stiahnuť mesiac' : 'Stiahnuť PDF'}
            </div>
            <div className="ft-export-meta">
              {batchMode ? 'Offline PDF aktuálne vybraného mesiaca' : 'Plne offline · dáta zostávajú v zariadení'}
            </div>
          </div>
          <button
            id="download-pdf-btn"
            className="ft-btn ft-btn-primary"
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <><span className="ft-spinner" /> Generujem…</>
              : <>Stiahnuť PDF</>
            }
          </button>
        </div>
        {pdfError && (
          <div className="ft-error-msg">{pdfError}</div>
        )}
      </div>

    </aside>
  );
}
