import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer';

// Register Roboto font for full Slovak character (Latin extended) support
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  // Upper Row (Logo and basic info)
  upperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  logoContainer: {
    width: 220,
  },
  logoBox: {
    border: '1.5px solid #1a1a1a',
    padding: '6 10',
    marginBottom: 4,
  },
  logoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 7.5,
    marginTop: 1,
    color: '#555555',
  },
  bankRegister: {
    fontSize: 6,
    color: '#6b7280',
    lineHeight: 1.2,
  },
  // Upper Right Metadata
  metaBlock: {
    width: 180,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    marginVertical: 1,
  },
  metaLabel: {
    color: '#4b5563',
  },
  metaValue: {
    fontWeight: 'bold',
  },
  // Client ID row below registration info
  regAndClientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: 8,
    marginBottom: 15,
  },
  clientIdBlock: {
    width: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
  },
  // Main Title section
  titleSection: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Account Information details
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 10,
    marginBottom: 12,
  },
  accountCol: {
    width: '50%',
    marginVertical: 1.5,
  },
  accountRow: {
    flexDirection: 'row',
    fontSize: 8,
  },
  accountLabel: {
    width: 60,
    color: '#4b5563',
  },
  accountValue: {
    fontWeight: 'bold',
    flex: 1,
  },
  // Additional info and Client Address section
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    minHeight: 65,
  },
  limitsBlock: {
    width: '50%',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    fontSize: 8,
    marginVertical: 2,
  },
  limitLabel: {
    color: '#4b5563',
  },
  limitValue: {
    fontWeight: 'bold',
  },
  addressBlock: {
    width: '45%',
    paddingLeft: 12,
    borderLeft: '2px solid #a1a1aa',
    justifyContent: 'center',
  },
  addressName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 8.5,
    color: '#374151',
    marginVertical: 1,
  },
  // Table
  table: {
    width: '100%',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTop: '1px solid #1a1a1a',
    borderBottom: '1px solid #1a1a1a',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#fafafa',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#1a1a1a',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  colRealiz: { width: '11%' },
  colValuta: { width: '11%' },
  colDesc: { width: '58%', paddingRight: 8 },
  colAmount: { width: '20%', textAlign: 'right' },
  txTextMuted: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 1,
  },
  txTextBold: {
    fontWeight: 'bold',
    fontSize: 8,
  },
  amountCredit: { fontWeight: 'bold', color: '#1a1a1a' },
  amountDebit: { fontWeight: 'bold', color: '#1a1a1a' },
  // Summary balances
  balancesSection: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  balanceGrid: {
    width: 200,
    borderTop: '1px solid #1a1a1a',
    paddingTop: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
    fontSize: 7.5,
  },
  balanceRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: 'bold',
    borderTop: '1px solid #1a1a1a',
    marginTop: 3,
    paddingTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: '#9ca3af',
  },
});

export const StatementDocument = ({ sourceOfTruth }: { sourceOfTruth: any }) => {
  const { bank, client, statement, balances, transactions } = sourceOfTruth;

  // Format currency output helper
  const formatMoney = (val: number) => {
    const formatted = val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} ${statement.statement_currency || 'EUR'}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Upper Logo and Meta Row */}
        <View style={styles.upperRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoTitle}>{bank?.bank_logo_id || 'VÚB BANKA'}</Text>
              <Text style={styles.logoSub}>Intesa Sanpaolo Group</Text>
            </View>
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Por. číslo:</Text>
              <Text style={styles.metaValue}>
                {statement.statement_month && statement.statement_year 
                  ? `${statement.statement_month}/${statement.statement_year}`
                  : statement.statement_number || ''
                }
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Strana:</Text>
              <Text style={styles.metaValue} render={({ pageNumber, totalPages }) => 
                `${pageNumber}/${totalPages}`
              } />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Zo dňa:</Text>
              <Text style={styles.metaValue}>{statement.statement_date || ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Pobočka:</Text>
              <Text style={styles.metaValue}>{bank?.bank_outlet_id || ''}</Text>
            </View>
          </View>
        </View>

        {/* Bank Reg Info and Client ID Row */}
        <View style={styles.regAndClientRow}>
          <View style={{ width: 300 }}>
            <Text style={styles.bankRegister}>{bank?.bank_register_info || ''}</Text>
          </View>
          <View style={styles.clientIdBlock}>
            <Text style={{ color: '#4b5563' }}>IČO klienta:</Text>
            <Text style={{ fontWeight: 'bold' }}>{client.client_id || ''}</Text>
          </View>
        </View>

        {/* Main Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{statement.statement_title || 'VÝPIS Z ÚČTU'}</Text>
        </View>

        {/* Account Parameters */}
        <View style={styles.accountGrid}>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Názov:</Text>
              <Text style={styles.accountValue}>{client.client_title}</Text>
            </View>
          </View>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Mena:</Text>
              <Text style={styles.accountValue}>{statement.statement_currency || 'EUR'}</Text>
            </View>
          </View>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Číslo:</Text>
              <Text style={styles.accountValue}>{client.client_iban}</Text>
            </View>
          </View>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Typ:</Text>
              <Text style={styles.accountValue}>{client.client_account || ''}</Text>
            </View>
          </View>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>BIC:</Text>
              <Text style={styles.accountValue}>{client.client_swift}</Text>
            </View>
          </View>
          <View style={styles.accountCol}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Pobočka:</Text>
              <Text style={styles.accountValue}>{bank?.bank_outlet_address || ''}</Text>
            </View>
          </View>
        </View>

        {/* Limits Section & Mailing Address Section */}
        <View style={styles.middleSection}>
          <View style={styles.limitsBlock}>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Limit povoleného prečerpania:</Text>
              <Text style={styles.limitValue}>{client.client_limit || '0,00'}</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Platnosť povoleného prečerpania:</Text>
              <Text style={styles.limitValue}></Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Frekvencia výpisov:</Text>
              <Text style={styles.limitValue}>{statement.statement_frequency || ''}</Text>
            </View>
          </View>

          <View style={styles.addressBlock}>
            <Text style={styles.addressName}>{client.client_title}</Text>
            <Text style={styles.addressText}>{client.client_street}</Text>
            <Text style={styles.addressText}>
              {`${client.client_zip || ''} ${client.client_city || ''}`.trim()}
            </Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colRealiz]}>Zaúčtov.</Text>
            <Text style={[styles.tableHeaderText, styles.colValuta]}>Valuta</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Popis transakcie / Referencia</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Suma</Text>
          </View>

          {transactions.map((t: any, idx: number) => {
            // Prepare structured symbol details if present
            const symbols = [];
            if (t.vs) symbols.push(`VS: ${t.vs}`);
            if (t.ks) symbols.push(`KS: ${t.ks}`);
            if (t.ss) symbols.push(`ŠS: ${t.ss}`);
            const symbolLine = symbols.join('   ');

            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.colRealiz, { fontSize: 7.5 }]}>{t.date_realiz}</Text>
                <Text style={[styles.colValuta, { fontSize: 7.5 }]}>{t.date_valuta}</Text>
                
                <View style={styles.colDesc}>
                  <Text style={styles.txTextBold}>{t.popis || ''}</Text>
                  {symbolLine ? (
                    <Text style={styles.txTextMuted}>{symbolLine}</Text>
                  ) : null}
                  {t.account ? (
                    <Text style={styles.txTextMuted}>Účet protistrany: {t.account}</Text>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.colAmount,
                    t.amount >= 0 ? styles.amountCredit : styles.amountDebit,
                  ]}
                >
                  {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Balances summary */}
        <View style={styles.balancesSection}>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceRow}>
              <Text style={{ color: '#4b5563' }}>Počiatočný zostatok:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatMoney(balances.opening_balance)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={{ color: '#4b5563' }}>Príjmy (kredit):</Text>
              <Text style={{ fontWeight: 'bold' }}>+{formatMoney(balances.total_credit)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={{ color: '#4b5563' }}>Výdavky (debet):</Text>
              <Text style={{ fontWeight: 'bold' }}>−{formatMoney(balances.total_debit)}</Text>
            </View>
            <View style={styles.balanceRowFinal}>
              <Text>Konečný zostatok:</Text>
              <Text>{formatMoney(balances.closing_balance)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Vygenerované offline · VÚB Banka Statement Generator
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Strana ${pageNumber} / ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  );
};

export default function RightPanel() {
  const { 
    sourceOfTruth, 
    setBankData, 
    setClientData, 
    setStatementData, 
    setOpeningBalance, 
    setTransactions 
  } = useAppStore();

  const { bank, client, statement, balances, transactions } = sourceOfTruth;

  const [viewMode, setViewMode] = useState<'pdf' | 'editor'>('pdf');
  
  // State for editing generic fields
  interface EditingField {
    section: 'bank' | 'client' | 'statement' | 'balances';
    key: string;
    label: string;
    value: string;
  }
  const [editingField, setEditingField] = useState<EditingField | null>(null);

  // State for editing transactions
  const [editingTxIndex, setEditingTxIndex] = useState<number | null>(null);
  const [txEditData, setTxEditData] = useState({
    date_realiz: '',
    date_valuta: '',
    popis: '',
    vs: '',
    ks: '',
    ss: '',
    account: '',
    amount: '0'
  });

  // Keep transaction edit form in sync with chosen index
  useEffect(() => {
    if (editingTxIndex !== null && transactions[editingTxIndex]) {
      const tx = transactions[editingTxIndex];
      setTxEditData({
        date_realiz: tx.date_realiz || '',
        date_valuta: tx.date_valuta || '',
        popis: tx.popis || '',
        vs: tx.vs || '',
        ks: tx.ks || '',
        ss: tx.ss || '',
        account: tx.account || '',
        amount: tx.amount.toString()
      });
    }
  }, [editingTxIndex, transactions]);

  // Format currency helper for the HTML preview
  const formatMoney = (val: number) => {
    const formatted = val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} ${statement.statement_currency || 'EUR'}`;
  };

  const handleEditField = (section: any, key: string, label: string, currentVal: string) => {
    setEditingField({
      section,
      key,
      label,
      value: currentVal
    });
  };

  const handleSaveField = () => {
    if (!editingField) return;
    const { section, key, value } = editingField;

    if (section === 'bank') {
      setBankData({ [key]: value });
    } else if (section === 'client') {
      setClientData({ [key]: value });
    } else if (section === 'statement') {
      if (key === 'statement_number') {
        // Clear statement_month and statement_year to let the custom number render
        setStatementData({
          statement_number: value,
          statement_month: '',
          statement_year: ''
        });
      } else {
        setStatementData({ [key]: value });
      }
    } else if (section === 'balances') {
      if (key === 'opening_balance') {
        const parsed = parseFloat(value.replace(/\s/g, '').replace(',', '.'));
        setOpeningBalance(isNaN(parsed) ? 0 : parsed);
      }
    }

    setEditingField(null);
  };

  const handleSaveTx = () => {
    if (editingTxIndex === null) return;
    const updatedTransactions = [...transactions];
    const parsedAmount = parseFloat(txEditData.amount);

    updatedTransactions[editingTxIndex] = {
      ...updatedTransactions[editingTxIndex],
      date_realiz: txEditData.date_realiz,
      date_valuta: txEditData.date_valuta,
      popis: txEditData.popis,
      vs: txEditData.vs || undefined,
      ks: txEditData.ks || undefined,
      ss: txEditData.ss || undefined,
      account: txEditData.account || undefined,
      amount: isNaN(parsedAmount) ? 0 : parsedAmount
    };

    setTransactions(updatedTransactions);
    setEditingTxIndex(null);
  };

  const handleDeleteTx = () => {
    if (editingTxIndex === null) return;
    const updatedTransactions = transactions.filter((_, idx) => idx !== editingTxIndex);
    setTransactions(updatedTransactions);
    setEditingTxIndex(null);
  };

  return (
    <div className="ft-right">
      <div className="ft-right-bg" />
      <div className="ft-preview-header">
        <div className="ft-preview-label">
          <span className="ft-preview-dot" />
          {viewMode === 'pdf' ? 'Live PDF Preview' : 'Interactive Editor (Magic Mirror)'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className={`ft-preview-toggle-btn ${viewMode === 'pdf' ? 'active' : ''}`}
            onClick={() => setViewMode('pdf')}
          >
            PDF Náhľad
          </button>
          <button 
            className={`ft-preview-toggle-btn ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
          >
            Editor (HTML)
          </button>
        </div>
      </div>

      <div className="ft-preview-body">
        {viewMode === 'pdf' ? (
          <PDFViewer className="ft-pdf-viewer">
            <StatementDocument sourceOfTruth={sourceOfTruth} />
          </PDFViewer>
        ) : (
          <div className="ft-html-sheet-container">
            <div className="ft-html-sheet">
              {/* Upper Row: Logo & Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ width: '220px' }}>
                  <div className="ft-mirror-logo-box">
                    <div 
                      className="ft-mirror-logo-title ft-mirror-editable"
                      onClick={() => handleEditField('bank', 'bank_logo_id', 'Logo banky', bank?.bank_logo_id || '')}
                    >
                      {bank?.bank_logo_id || 'VÚB BANKA'}
                    </div>
                    <div className="ft-mirror-logo-sub">Intesa Sanpaolo Group</div>
                  </div>
                  <div 
                    className="ft-mirror-bank-reg ft-mirror-editable"
                    onClick={() => handleEditField('bank', 'bank_register_info', 'Registračné info banky', bank?.bank_register_info || '')}
                  >
                    {bank?.bank_register_info || ''}
                  </div>
                </div>

                <div className="ft-mirror-meta-table">
                  <div className="ft-mirror-meta-row">
                    <span className="ft-mirror-meta-label">Por. číslo:</span>
                    <span 
                      className="ft-mirror-meta-value ft-mirror-editable"
                      onClick={() => handleEditField('statement', 'statement_number', 'Poradové číslo výpisu', statement.statement_month && statement.statement_year ? `${statement.statement_month}/${statement.statement_year}` : (statement.statement_number || ''))}
                    >
                      {statement.statement_month && statement.statement_year 
                        ? `${statement.statement_month}/${statement.statement_year}`
                        : statement.statement_number || ''
                      }
                    </span>
                  </div>
                  <div className="ft-mirror-meta-row">
                    <span className="ft-mirror-meta-label">Strana:</span>
                    <span className="ft-mirror-meta-value">1/1</span>
                  </div>
                  <div className="ft-mirror-meta-row">
                    <span className="ft-mirror-meta-label">Zo dňa:</span>
                    <span 
                      className="ft-mirror-meta-value ft-mirror-editable"
                      onClick={() => handleEditField('statement', 'statement_date', 'Dátum vyhotovenia', statement.statement_date || '')}
                    >
                      {statement.statement_date || ''}
                    </span>
                  </div>
                  <div className="ft-mirror-meta-row">
                    <span className="ft-mirror-meta-label">Pobočka:</span>
                    <span 
                      className="ft-mirror-meta-value ft-mirror-editable"
                      onClick={() => handleEditField('bank', 'bank_outlet_id', 'Kód pobočky', bank?.bank_outlet_id || '')}
                    >
                      {bank?.bank_outlet_id || ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client ID Row */}
              <div className="ft-mirror-divider" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}>
                <div style={{ width: '300px', color: '#6b7280', fontSize: '6px' }}>
                  {/* Empty or auxiliary field */}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#4b5563' }}>IČO klienta:</span>
                  <span 
                    style={{ fontWeight: 'bold' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_id', 'IČO klienta', client.client_id || '')}
                  >
                    {client.client_id || ''}
                  </span>
                </div>
              </div>

              {/* Title Section */}
              <div 
                className="ft-mirror-title-section ft-mirror-editable"
                onClick={() => handleEditField('statement', 'statement_title', 'Titulok výpisu', statement.statement_title || '')}
              >
                {statement.statement_title || 'VÝPIS Z ÚČTU'}
              </div>

              {/* Account Parameters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>Názov:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_title', 'Názov majiteľa účtu', client.client_title || '')}
                  >
                    {client.client_title}
                  </span>
                </div>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>Mena:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('statement', 'statement_currency', 'Mena výpisu', statement.statement_currency || '')}
                  >
                    {statement.statement_currency || 'EUR'}
                  </span>
                </div>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>Číslo:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_iban', 'IBAN / Číslo účtu', client.client_iban || '')}
                  >
                    {client.client_iban}
                  </span>
                </div>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>Typ:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_account', 'Typ účtu', client.client_account || '')}
                  >
                    {client.client_account || ''}
                  </span>
                </div>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>BIC:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_swift', 'SWIFT BIC kód', client.client_swift || '')}
                  >
                    {client.client_swift}
                  </span>
                </div>
                <div style={{ width: '50%', margin: '1.5px 0', display: 'flex', fontSize: '8px' }}>
                  <span style={{ width: '60px', color: '#4b5563' }}>Pobočka:</span>
                  <span 
                    style={{ fontWeight: 'bold', flex: 1 }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('bank', 'bank_outlet_address', 'Adresa pobočky', bank?.bank_outlet_address || '')}
                  >
                    {bank?.bank_outlet_address || ''}
                  </span>
                </div>
              </div>

              {/* Limits and Client Address Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', minHeight: '65px' }}>
                <div style={{ width: '50%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', fontSize: '8px', margin: '2px 0' }}>
                    <span style={{ color: '#4b5563' }}>Limit povoleného prečerpania:</span>
                    <span 
                      style={{ fontWeight: 'bold' }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('client', 'client_limit', 'Limit povoleného prečerpania', client.client_limit || '')}
                    >
                      {client.client_limit || '0,00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', fontSize: '8px', margin: '2px 0' }}>
                    <span style={{ color: '#4b5563' }}>Platnosť povoleného prečerpania:</span>
                    <span style={{ fontWeight: 'bold' }}></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', fontSize: '8px', margin: '2px 0' }}>
                    <span style={{ color: '#4b5563' }}>Frekvencia výpisov:</span>
                    <span 
                      style={{ fontWeight: 'bold' }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('statement', 'statement_frequency', 'Frekvencia generovania výpisov', statement.statement_frequency || '')}
                    >
                      {statement.statement_frequency || ''}
                    </span>
                  </div>
                </div>

                <div className="ft-mirror-address-block" style={{ width: '45%', paddingLeft: '12px', borderLeft: '2px solid #a1a1aa', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div 
                    style={{ fontSize: '9.5px', fontWeight: 'bold', marginBottom: '2px' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_title', 'Meno/Názov adresáta', client.client_title || '')}
                  >
                    {client.client_title}
                  </div>
                  <div 
                    style={{ fontSize: '8.5px', color: '#374151', margin: '1px 0' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_street', 'Ulica a číslo', client.client_street || '')}
                  >
                    {client.client_street}
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#374151', margin: '1px 0' }}>
                    <span 
                      className="ft-mirror-editable" 
                      onClick={() => handleEditField('client', 'client_zip', 'PSČ', client.client_zip || '')}
                    >
                      {client.client_zip || ''}
                    </span>{' '}
                    <span 
                      className="ft-mirror-editable" 
                      onClick={() => handleEditField('client', 'client_city', 'Mesto', client.client_city || '')}
                    >
                      {client.client_city || ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <table style={{ width: '100%', marginTop: '5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', background: '#fafafa' }}>
                    <th style={{ textAlign: 'left', padding: '4px', fontSize: '7.5px', fontWeight: 'bold', width: '11%', color: '#1a1a1a' }}>ZAÚČTOV.</th>
                    <th style={{ textAlign: 'left', padding: '4px', fontSize: '7.5px', fontWeight: 'bold', width: '11%', color: '#1a1a1a' }}>VALUTA</th>
                    <th style={{ textAlign: 'left', padding: '4px', fontSize: '7.5px', fontWeight: 'bold', width: '58%', color: '#1a1a1a' }}>POPIS TRANSAKCIE / REFERENCIA</th>
                    <th style={{ textAlign: 'right', padding: '4px', fontSize: '7.5px', fontWeight: 'bold', width: '20%', color: '#1a1a1a' }}>SUMA</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: any, idx: number) => {
                    const symbols = [];
                    if (t.vs) symbols.push(`VS: ${t.vs}`);
                    if (t.ks) symbols.push(`KS: ${t.ks}`);
                    if (t.ss) symbols.push(`ŠS: ${t.ss}`);
                    const symbolLine = symbols.join('   ');

                    return (
                      <tr 
                        key={idx} 
                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                        className="ft-mirror-editable-row"
                        onClick={() => setEditingTxIndex(idx)}
                      >
                        <td style={{ padding: '6px 4px', fontSize: '7.5px', verticalAlign: 'top' }}>{t.date_realiz}</td>
                        <td style={{ padding: '6px 4px', fontSize: '7.5px', verticalAlign: 'top' }}>{t.date_valuta}</td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '8px' }}>{t.popis || ''}</div>
                          {symbolLine && <div style={{ fontSize: '7px', color: '#6b7280', marginTop: '1px' }}>{symbolLine}</div>}
                          {t.account && <div style={{ fontSize: '7px', color: '#6b7280', marginTop: '1px' }}>Účet protistrany: {t.account}</div>}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold', fontSize: '8px', verticalAlign: 'top' }}>
                          <span>{t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Balances summary */}
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '200px', borderTop: '1px solid #1a1a1a', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '7.5px' }}>
                    <span style={{ color: '#4b5563' }}>Počiatočný zostatok:</span>
                    <span 
                      style={{ fontWeight: 'bold' }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('balances', 'opening_balance', 'Počiatočný zostatok', balances.opening_balance.toString())}
                    >
                      {formatMoney(balances.opening_balance)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '7.5px' }}>
                    <span style={{ color: '#4b5563' }}>Príjmy (kredit):</span>
                    <span style={{ fontWeight: 'bold' }}>+{formatMoney(balances.total_credit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '7.5px' }}>
                    <span style={{ color: '#4b5563' }}>Výdavky (debet):</span>
                    <span style={{ fontWeight: 'bold' }}>−{formatMoney(balances.total_debit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9px', fontWeight: 'bold', borderTop: '1px solid #1a1a1a', marginTop: '3px', paddingTop: '3px' }}>
                    <span>Konečný zostatok:</span>
                    <span>{formatMoney(balances.closing_balance)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ position: 'absolute', bottom: '20px', left: '20mm', right: '20mm', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                <span style={{ fontSize: '7.5px', color: '#9ca3af' }}>Vygenerované offline · VÚB Banka Statement Generator</span>
                <span style={{ fontSize: '7.5px', color: '#9ca3af' }}>Strana 1 / 1</span>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Floating Editor Modal (Generic Fields) */}
      {editingField && (
        <div className="ft-mirror-modal-backdrop" onClick={() => setEditingField(null)}>
          <div className="ft-mirror-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ft-mirror-modal-header">
              <h4>Upraviť hodnotu</h4>
              <button className="ft-mirror-close-btn" onClick={() => setEditingField(null)}>×</button>
            </div>
            <div className="ft-mirror-modal-body">
              <label htmlFor="generic-field-input" className="ft-label" style={{ marginBottom: '8px', display: 'block' }}>{editingField.label}</label>
              {editingField.key === 'bank_register_info' ? (
                <textarea
                  id="generic-field-input"
                  className="ft-input"
                  rows={4}
                  value={editingField.value}
                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                  style={{ width: '100%', resize: 'none' }}
                />
              ) : (
                <input
                  id="generic-field-input"
                  type="text"
                  className="ft-input"
                  value={editingField.value}
                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                  style={{ width: '100%' }}
                />
              )}
            </div>
            <div className="ft-mirror-modal-footer">
              <button className="ft-btn ft-btn-sub" onClick={() => setEditingField(null)}>
                Zrušiť
              </button>
              <button className="ft-btn ft-btn-primary" onClick={handleSaveField}>
                Uložiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Editor Modal (Transactions) */}
      {editingTxIndex !== null && (
        <div className="ft-mirror-modal-backdrop" onClick={() => setEditingTxIndex(null)}>
          <div className="ft-mirror-modal" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ft-mirror-modal-header">
              <h4>Upraviť transakciu #{editingTxIndex + 1}</h4>
              <button className="ft-mirror-close-btn" onClick={() => setEditingTxIndex(null)}>×</button>
            </div>
            <div className="ft-mirror-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-realiz" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Zaúčtované</label>
                  <input
                    id="tx-realiz"
                    type="text"
                    className="ft-input"
                    value={txEditData.date_realiz}
                    onChange={(e) => setTxEditData({ ...txEditData, date_realiz: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-valuta" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Valuta</label>
                  <input
                    id="tx-valuta"
                    type="text"
                    className="ft-input"
                    value={txEditData.date_valuta}
                    onChange={(e) => setTxEditData({ ...txEditData, date_valuta: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="tx-popis" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Popis transakcie</label>
                <textarea
                  id="tx-popis"
                  className="ft-input"
                  rows={2}
                  value={txEditData.popis}
                  onChange={(e) => setTxEditData({ ...txEditData, popis: e.target.value })}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-vs" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>VS</label>
                  <input
                    id="tx-vs"
                    type="text"
                    className="ft-input"
                    value={txEditData.vs || ''}
                    onChange={(e) => setTxEditData({ ...txEditData, vs: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-ks" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>KS</label>
                  <input
                    id="tx-ks"
                    type="text"
                    className="ft-input"
                    value={txEditData.ks || ''}
                    onChange={(e) => setTxEditData({ ...txEditData, ks: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-ss" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>ŠS</label>
                  <input
                    id="tx-ss"
                    type="text"
                    className="ft-input"
                    value={txEditData.ss || ''}
                    onChange={(e) => setTxEditData({ ...txEditData, ss: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="tx-account" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Účet protistrany</label>
                <input
                  id="tx-account"
                  type="text"
                  className="ft-input"
                  value={txEditData.account || ''}
                  onChange={(e) => setTxEditData({ ...txEditData, account: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="tx-amount" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Suma</label>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  className="ft-input"
                  value={txEditData.amount}
                  onChange={(e) => setTxEditData({ ...txEditData, amount: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="ft-mirror-modal-footer">
              <button className="ft-btn ft-btn-sub" onClick={() => setEditingTxIndex(null)}>
                Zrušiť
              </button>
              <button 
                className="ft-btn ft-btn-danger" 
                onClick={handleDeleteTx}
                style={{ marginRight: 'auto', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgb(239, 68, 68)', color: '#ef4444' }}
              >
                Zmazať
              </button>
              <button className="ft-btn ft-btn-primary" onClick={handleSaveTx}>
                Uložiť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
