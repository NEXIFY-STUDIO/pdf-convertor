import { useAppStore } from '../store/useAppStore';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
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
  const { sourceOfTruth } = useAppStore();

  return (
    <div className="ft-right">
      <div className="ft-right-bg" />
      <div className="ft-preview-header">
        <div className="ft-preview-label">
          <span className="ft-preview-dot" />
          Live PDF Preview
        </div>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          A4 · Helvetica · Offline render
        </span>
      </div>
      <div className="ft-preview-body">
        <PDFViewer className="ft-pdf-viewer">
          <StatementDocument sourceOfTruth={sourceOfTruth} />
        </PDFViewer>
      </div>
    </div>
  );
}
