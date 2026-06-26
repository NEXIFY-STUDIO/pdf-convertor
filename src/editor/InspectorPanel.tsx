import { useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAppStore } from '../store/useAppStore';
import { FIELD_BLUEPRINT, type FieldDef } from './fieldBlueprint';
import type { TransactionType } from '../schema/sourceOfTruth';

function formatMoney(val: number, currency = 'EUR') {
  const formatted = val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${currency}`;
}

function getFieldValue(section: FieldDef['section'], key: string, sourceOfTruth: ReturnType<typeof useAppStore.getState>['sourceOfTruth']): string {
  if (section === 'balances' && key === 'opening_balance') {
    return String(sourceOfTruth.balances.opening_balance);
  }
  const data = sourceOfTruth[section] as Record<string, unknown>;
  const val = data[key];
  if (val === undefined || val === null) return '';
  return String(val);
}

const EMPTY_TX_FORM = {
  date_realiz: '',
  date_booking: '',
  date_valuta: '',
  popis: '',
  details: '',
  vs: '',
  ks: '',
  ss: '',
  account: '',
  bank_ref: '',
  fee_type: '',
  amount: '0',
  is_fee: false,
};

export default function InspectorPanel() {
  const sourceOfTruth = useAppStore(state => state.sourceOfTruth, shallow);
  const setBankData = useAppStore(state => state.setBankData);
  const setClientData = useAppStore(state => state.setClientData);
  const setStatementData = useAppStore(state => state.setStatementData);
  const setOpeningBalance = useAppStore(state => state.setOpeningBalance);
  const setTransactions = useAppStore(state => state.setTransactions);

  const { bank, statement, balances, transactions } = sourceOfTruth;

  const [activeField, setActiveField] = useState<FieldDef | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [editingTxIndex, setEditingTxIndex] = useState<number | null>(null);
  const [txEditData, setTxEditData] = useState(EMPTY_TX_FORM);

  useEffect(() => {
    if (editingTxIndex !== null && transactions[editingTxIndex]) {
      const tx = transactions[editingTxIndex];
      setTxEditData({
        date_realiz: tx.date_realiz || '',
        date_booking: tx.date_booking || tx.date_realiz || '',
        date_valuta: tx.date_valuta || '',
        popis: tx.popis || '',
        details: tx.details?.join('\n') || '',
        vs: tx.vs || '',
        ks: tx.ks || '',
        ss: tx.ss || '',
        account: tx.account || '',
        bank_ref: tx.bank_ref || '',
        fee_type: tx.fee_type || '',
        amount: tx.amount.toString(),
        is_fee: tx.is_fee || false,
      });
    }
  }, [editingTxIndex, transactions]);

  const openField = (field: FieldDef) => {
    setActiveField(field);
    setFieldValue(getFieldValue(field.section, field.key, sourceOfTruth));
    setEditingTxIndex(null);
  };

  const saveField = () => {
    if (!activeField) return;
    const { section, key } = activeField;

    if (section === 'bank') {
      setBankData({ [key]: fieldValue });
    } else if (section === 'client') {
      setClientData({ [key]: fieldValue });
    } else if (section === 'statement') {
      if (key === 'statement_number') {
        setStatementData({ statement_number: fieldValue, statement_month: '', statement_year: '' });
      } else {
        setStatementData({ [key]: fieldValue });
      }
    } else if (section === 'balances' && key === 'opening_balance') {
      const parsed = parseFloat(fieldValue.replace(/\s/g, '').replace(',', '.'));
      setOpeningBalance(isNaN(parsed) ? 0 : parsed);
    }

    setActiveField(null);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBankData({ bank_logo_image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const saveTx = () => {
    if (editingTxIndex === null) return;
    const parsedAmount = parseFloat(txEditData.amount);
    const updated: TransactionType[] = [...transactions];
    const details = txEditData.details
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    updated[editingTxIndex] = {
      ...updated[editingTxIndex],
      date_realiz: txEditData.date_realiz,
      date_booking: txEditData.date_booking,
      date_valuta: txEditData.date_valuta,
      popis: txEditData.popis,
      details: details.length > 0 ? details : undefined,
      vs: txEditData.vs || undefined,
      ks: txEditData.ks || undefined,
      ss: txEditData.ss || undefined,
      account: txEditData.account || undefined,
      bank_ref: txEditData.bank_ref || undefined,
      fee_type: txEditData.fee_type || undefined,
      amount: isNaN(parsedAmount) ? 0 : parsedAmount,
      is_fee: txEditData.is_fee,
      type: txEditData.is_fee ? 'fee' : (parsedAmount >= 0 ? 'incoming' : 'outgoing'),
    };
    setTransactions(updated);
    setEditingTxIndex(null);
  };

  const deleteTx = () => {
    if (editingTxIndex === null) return;
    setTransactions(transactions.filter((_, idx) => idx !== editingTxIndex));
    setEditingTxIndex(null);
  };

  const currency = statement.statement_currency || 'EUR';

  return (
    <div className="ft-inspector">
      <div className="ft-inspector-summary">
        <button
          type="button"
          className="ft-inspector-summary-row ft-inspector-summary-editable"
          onClick={() => openField({ section: 'balances', key: 'opening_balance', label: 'Počiatočný zostatok', type: 'number' })}
        >
          <span>Počiatočný zostatok</span>
          <strong>{formatMoney(balances.opening_balance, currency)}</strong>
        </button>
        <div className="ft-inspector-summary-row">
          <span>Kredity</span>
          <strong>{formatMoney(balances.total_credit, currency)}</strong>
        </div>
        <div className="ft-inspector-summary-row">
          <span>Debet</span>
          <strong>{formatMoney(balances.total_debit, currency)}</strong>
        </div>
        <div className="ft-inspector-summary-row ft-inspector-summary-final">
          <span>Konečný zostatok</span>
          <strong>{formatMoney(balances.closing_balance, currency)}</strong>
        </div>
      </div>

      <div className="ft-inspector-section">
        <h4 className="ft-inspector-heading">Logo banky</h4>
        {bank.bank_logo_image ? (
          <div className="ft-inspector-logo">
            <img src={bank.bank_logo_image} alt="Bank Logo" />
            <button
              type="button"
              className="ft-btn ft-btn-ghost ft-btn-sm"
              onClick={() => setBankData({ bank_logo_image: undefined })}
            >
              Odstrániť logo
            </button>
          </div>
        ) : (
          <label className="ft-inspector-upload">
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = '';
              }}
            />
            Nahrať logo (PNG/JPG/SVG)
          </label>
        )}
      </div>

      {FIELD_BLUEPRINT.map(({ group, fields }) => (
        <div key={group} className="ft-inspector-section">
          <h4 className="ft-inspector-heading">{group}</h4>
          <div className="ft-inspector-fields">
            {fields.map((field) => (
              <button
                key={`${field.section}.${field.key}`}
                type="button"
                className={`ft-inspector-field-btn ${activeField?.key === field.key && activeField?.section === field.section ? 'active' : ''}`}
                onClick={() => openField(field)}
              >
                <span className="ft-inspector-field-label">{field.label}</span>
                <span className="ft-inspector-field-value">
                  {getFieldValue(field.section, field.key, sourceOfTruth) || '—'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="ft-inspector-section">
        <h4 className="ft-inspector-heading">Transakcie ({transactions.length})</h4>
        <div className="ft-inspector-tx-list">
          {transactions.map((tx, idx) => (
            <button
              key={idx}
              type="button"
              className={`ft-inspector-tx-row ${editingTxIndex === idx ? 'active' : ''}`}
              onClick={() => { setEditingTxIndex(idx); setActiveField(null); }}
            >
              <span className="ft-inspector-tx-date">{tx.date_realiz}</span>
              <span className="ft-inspector-tx-desc">{tx.popis || 'Bez popisu'}</span>
              <span className={`ft-inspector-tx-amount ${tx.amount >= 0 ? 'credit' : 'debit'}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeField && (
        <div className="ft-inspector-editor">
          <label className="ft-label" htmlFor="inspector-field-input">{activeField.label}</label>
          {activeField.multiline ? (
            <textarea
              id="inspector-field-input"
              className="ft-input"
              rows={4}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
            />
          ) : (
            <input
              id="inspector-field-input"
              type={activeField.type === 'number' ? 'number' : 'text'}
              className="ft-input"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
            />
          )}
          <div className="ft-inspector-editor-actions">
            <button type="button" className="ft-btn ft-btn-sub" onClick={() => setActiveField(null)}>Zrušiť</button>
            <button type="button" className="ft-btn ft-btn-primary" onClick={saveField}>Uložiť</button>
          </div>
        </div>
      )}

      {editingTxIndex !== null && (
        <div className="ft-inspector-editor">
          <h4 className="ft-inspector-heading">Transakcia #{editingTxIndex + 1}</h4>
          <div className="ft-inspector-tx-form">
            <div className="ft-inspector-tx-dates">
              <div>
                <label className="ft-label" htmlFor="tx-booking">Zaúčtované</label>
                <input id="tx-booking" className="ft-input" value={txEditData.date_booking} onChange={(e) => setTxEditData({ ...txEditData, date_booking: e.target.value })} />
              </div>
              <div>
                <label className="ft-label" htmlFor="tx-realiz">Realizované</label>
                <input id="tx-realiz" className="ft-input" value={txEditData.date_realiz} onChange={(e) => setTxEditData({ ...txEditData, date_realiz: e.target.value })} />
              </div>
              <div>
                <label className="ft-label" htmlFor="tx-valuta">Valuta</label>
                <input id="tx-valuta" className="ft-input" value={txEditData.date_valuta} onChange={(e) => setTxEditData({ ...txEditData, date_valuta: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="ft-label" htmlFor="tx-popis">Popis (krátky)</label>
              <textarea id="tx-popis" className="ft-input" rows={2} value={txEditData.popis} onChange={(e) => setTxEditData({ ...txEditData, popis: e.target.value })} />
            </div>
            <div>
              <label className="ft-label" htmlFor="tx-details">Detail riadky PDF (1 riadok = 1 riadok v PDF)</label>
              <textarea id="tx-details" className="ft-input" rows={4} value={txEditData.details} onChange={(e) => setTxEditData({ ...txEditData, details: e.target.value })} placeholder="IBAN&#10;Názov protistrany&#10;BIC: SUBASKBX" />
            </div>
            <div className="ft-inspector-tx-symbols">
              <div>
                <label className="ft-label" htmlFor="tx-vs">VS</label>
                <input id="tx-vs" className="ft-input" value={txEditData.vs} onChange={(e) => setTxEditData({ ...txEditData, vs: e.target.value })} />
              </div>
              <div>
                <label className="ft-label" htmlFor="tx-ks">KS</label>
                <input id="tx-ks" className="ft-input" value={txEditData.ks} onChange={(e) => setTxEditData({ ...txEditData, ks: e.target.value })} />
              </div>
              <div>
                <label className="ft-label" htmlFor="tx-ss">ŠS</label>
                <input id="tx-ss" className="ft-input" value={txEditData.ss} onChange={(e) => setTxEditData({ ...txEditData, ss: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="ft-label" htmlFor="tx-account">Účet protistrany</label>
              <input id="tx-account" className="ft-input" value={txEditData.account} onChange={(e) => setTxEditData({ ...txEditData, account: e.target.value })} />
            </div>
            <div className="ft-inspector-tx-symbols">
              <div>
                <label className="ft-label" htmlFor="tx-bank-ref">Bank. referencia</label>
                <input id="tx-bank-ref" className="ft-input" value={txEditData.bank_ref} onChange={(e) => setTxEditData({ ...txEditData, bank_ref: e.target.value })} />
              </div>
              <div>
                <label className="ft-label" htmlFor="tx-fee-type">Typ popl. (I/X/L)</label>
                <input id="tx-fee-type" className="ft-input" maxLength={1} value={txEditData.fee_type} onChange={(e) => setTxEditData({ ...txEditData, fee_type: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="ft-inspector-tx-amount-row">
              <div>
                <label className="ft-label" htmlFor="tx-amount">Suma</label>
                <input id="tx-amount" type="number" step="0.01" className="ft-input" value={txEditData.amount} onChange={(e) => setTxEditData({ ...txEditData, amount: e.target.value })} />
              </div>
              <label className="ft-inspector-fee-check">
                <input type="checkbox" checked={txEditData.is_fee} onChange={(e) => setTxEditData({ ...txEditData, is_fee: e.target.checked })} />
                Poplatok banky
              </label>
            </div>
          </div>
          <div className="ft-inspector-editor-actions">
            <button type="button" className="ft-btn ft-btn-danger" onClick={deleteTx}>Zmazať</button>
            <button type="button" className="ft-btn ft-btn-sub" onClick={() => setEditingTxIndex(null)}>Zrušiť</button>
            <button type="button" className="ft-btn ft-btn-primary" onClick={saveTx}>Uložiť</button>
          </div>
        </div>
      )}
    </div>
  );
}