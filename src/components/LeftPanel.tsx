import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Papa from 'papaparse';
import { TransactionType } from '../schema/sourceOfTruth';
import { pdf } from '@react-pdf/renderer';
import { StatementDocument } from './RightPanel';

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
  URL.revokeObjectURL(url);
}

export default function LeftPanel() {
  const { sourceOfTruth, setBankData, setClientData, setStatementData, setOpeningBalance, setTransactions } = useAppStore();
  const { bank, client, statement, balances, transactions } = sourceOfTruth;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

const mapJsonTransactions = (rows: any[]): TransactionType[] => {
  return rows.map((row: any) => {
    const dateRealiz = row.transfer_confirmed_date || row.date_realiz || row.Date || row.date || '';
    const dateValuta = row.transfer_currency_date || row.date_valuta || row.Date || row.date || dateRealiz || '';
    
    let amt = 0;
    if (row.transfer_amount !== undefined) {
      amt = parseFloat(row.transfer_amount);
      if (row.transfer_type === 'outgoing') {
        amt = -Math.abs(amt);
      } else {
        amt = Math.abs(amt);
      }
    } else {
      amt = parseFloat(row.Amount || row.amount || '0');
    }
    
    const popis = row.transfer_description || row.popis || row.Description || '';
    const account = row.transfer_recipient_iban || row.account || '';
    const vs = row.transfer_variable_symbol || row.vs || '';
    const ks = row.transfer_constant_symbol || row.ks || '';
    const ss = row.transfer_specific_symbol || row.ss || '';
    const type = row.transfer_type || row.type || '';

    return {
      date_realiz: dateRealiz,
      date_valuta: dateValuta,
      amount: amt,
      popis,
      account,
      vs,
      ks,
      ss,
      type
    };
  });
};

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

  return (
    <aside className="ft-left">

      {/* ── Bank Data ── */}
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

      {/* ── Client Data ── */}
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

      {/* ── Export ── */}
      <div className="ft-export-card">
        <div className="ft-export-row">
          <div className="ft-export-info">
            <div className="ft-export-title">Stiahnuť PDF</div>
            <div className="ft-export-meta">Plne offline · dáta zostávajú v zariadení</div>
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
