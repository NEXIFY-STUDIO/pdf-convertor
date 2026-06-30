import { memo } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import {
  getTransactionLines,
  getTransactionCol4Lines,
  getTransactionCol7Value,
} from '../shared/transactionRender';

// ============================================
// 1. FONT REGISTRATION (DejaVu Sans for Slovak diacritics)
// ============================================
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const assetBase = isNode ? 'public/' : import.meta.env.BASE_URL;

Font.register({
  family: 'DejaVu Sans',
  fonts: [
    { src: `${assetBase}fonts/DejaVuSans.ttf`, fontWeight: 400 },
    { src: `${assetBase}fonts/DejaVuSans-Bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'DejaVu Sans Mono',
  fonts: [
    { src: `${assetBase}fonts/DejaVuSansMono.ttf`, fontWeight: 400 },
    { src: `${assetBase}fonts/DejaVuSansMono-Bold.ttf`, fontWeight: 700 },
  ],
});

// Map Cousine and Inter to DejaVu fonts to avoid bundle size increases
Font.register({
  family: 'Cousine',
  fonts: [
    { src: `${assetBase}fonts/DejaVuSansMono.ttf`, fontWeight: 400 },
    { src: `${assetBase}fonts/DejaVuSansMono-Bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: `${assetBase}fonts/DejaVuSans.ttf`, fontWeight: 400 },
    { src: `${assetBase}fonts/DejaVuSans-Bold.ttf`, fontWeight: 700 },
  ],
});

// ============================================
// 2. STYLES (Adjusted for A4 and DejaVu fonts)
// ============================================
const styles = StyleSheet.create({
  page: {
    padding: '15mm',  // ZMENA: Z 18mm na 15mm (viac miesta)
    fontFamily: 'DejaVu Sans',
    color: '#000000',  // ZMENA: Z #1a1a1a na #000000
    fontSize: 7,
    lineHeight: 1.0,   // ZMENA: Z 1.2 na 1.0 (tesnejšie riadky)
    backgroundColor: '#ffffff',
  },
  header: {
    fontFamily: 'DejaVu Sans',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 15,
  },
  text: {
    fontFamily: 'DejaVu Sans',
    fontSize: 8,
    color: '#000000',
  },
  smallText: {
    fontFamily: 'DejaVu Sans',
    fontSize: 7,
    color: '#000000',
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
    fontSize: 8,
    marginVertical: 1,
  },
  metaLabel: {
    color: '#4b5563',
    width: 60,
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
    fontFamily: 'Cousine',
    fontSize: 8,
    lineHeight: 1.2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTop: '1px solid #1a1a1a',
    borderBottom: '1px solid #1a1a1a',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#fafafa',
    fontFamily: 'Cousine',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    fontFamily: 'Cousine',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 2.2,
    paddingHorizontal: 4,
    fontFamily: 'Cousine',
  },
  col1: { width: '6%', fontFamily: 'Cousine' },
  col2: { width: '9%', fontFamily: 'Cousine' },
  col3: { width: '51%', paddingRight: 4, fontFamily: 'Cousine' },
  col4: { width: '12%', fontFamily: 'Cousine' },
  col5: { width: '4%', fontFamily: 'Cousine' },
  col6: { width: '4%', fontFamily: 'Cousine' },
  col7: { width: '5%', fontFamily: 'Cousine' },
  col8: { width: '9%', textAlign: 'right', fontFamily: 'Cousine' },
  colHeaderCol: { flexDirection: 'column' },
  headerTextSmall: { fontSize: 6, color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Cousine' },
  headerTextNormal: { fontSize: 6.8, color: '#1a1a1a', fontWeight: 'bold', fontFamily: 'Cousine' },
  summaryContainer: { marginTop: 10, marginBottom: 10, fontFamily: 'Cousine' },
  summaryTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Cousine' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5, fontFamily: 'Cousine' },
  summaryRowBorder: { borderTop: '1px solid #1a1a1a', marginTop: 1, paddingTop: 1.5, fontFamily: 'Cousine' },
  summaryText: { fontSize: 7.5, fontFamily: 'Cousine' },
  summaryTextBold: { fontSize: 7.5, fontWeight: 'bold', fontFamily: 'Cousine' },
  txTextMuted: {
    fontSize: 6.2,
    color: '#6b7280',
    marginTop: 0.5,
    fontFamily: 'Cousine',
  },
  txTextBold: {
    fontWeight: 'bold',
    fontSize: 6.8,
    fontFamily: 'Cousine',
  },
  amountCredit: { fontWeight: 'bold', color: '#1a1a1a', fontFamily: 'Cousine' },
  amountDebit: { fontWeight: 'bold', color: '#1a1a1a', fontFamily: 'Cousine' },
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
    fontFamily: 'Cousine',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
    fontSize: 7.5,
    fontFamily: 'Cousine',
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
    fontFamily: 'Cousine',
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
  feeTable: {
    fontFamily: 'Cousine',
    fontSize: 6.5,
    marginTop: 3,
    borderTop: '0.5px solid #000000',
  },
  feeTableRow: {
    flexDirection: 'row',
    borderBottom: '0.5px dashed #cccccc',
    paddingVertical: 1.2,
  },
  feeTableCell: {
    fontFamily: 'Cousine',
    fontSize: 6.5,
  },
  feeTableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #000000',
    paddingVertical: 1.5,
  },
  loyaltyTable: {
    fontFamily: 'Cousine',
    fontSize: 6.5,
    marginTop: 3,
    borderTop: '0.5px solid #000000',
  },
  loyaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '0.5px dashed #cccccc',
    paddingVertical: 1.2,
  },
  loyaltyCell: {
    fontFamily: 'Cousine',
    fontSize: 6.5,
  },
  offerBlock: {
    marginTop: 4,
    borderTop: '0.5px solid #000000',
    paddingTop: 3,
  },
  offerTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  offerTableCell: {
    fontFamily: 'Inter',
    fontSize: 7.5,
  },
});

const formatShortDate = (d?: string) => {
  if (!d) return '';
  const clean = d.replace(/\//g, '.');
  const parts = clean.split('.');
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return d;
};

const formatSummaryValue = (val: number, isNegative = false) => {
  const absVal = Math.abs(val);
  const formatted = absVal.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative || val < 0 ? '-' : ''}${formatted}`;
};

const formatAmountValue = (val: number) => {
  const absVal = Math.abs(val);
  const formatted = absVal.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${val < 0 ? '-' : ''}${formatted}`;
};

const getDayBefore = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    const prevDay = String(date.getDate()).padStart(2, '0');
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    const prevYear = date.getFullYear();
    return `${prevDay}.${prevMonth}.${prevYear}`;
  }
  return dateStr;
};

const PageHeader = ({ bank, statement }: any) => {
  return (
    <View style={{ marginBottom: 12 }}>
      {/* Row 1: Logo + Upper Meta */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            {bank?.bank_logo_image ? (
              <Image src={bank.bank_logo_image} style={{ width: 140, height: 40, objectFit: 'contain', marginLeft: -4, marginBottom: 2 }} />
            ) : (
              <>
                <Text style={styles.logoTitle}>VÚB BANKA</Text>
                <Text style={styles.logoSub}>Intesa Sanpaolo Group</Text>
              </>
            )}
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
        </View>
      </View>

      {/* Row 2: Registry Info + Lower Meta */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #1a1a1a', paddingBottom: 6 }}>
        <View style={{ width: 350 }}>
          <Text style={[styles.bankRegister, { color: '#1a1a1a', fontSize: 6.8 }]}>
            VÚB, a.s., Mlynské nivy 1, 829 90 Bratislava, Obch. reg.: Okresný súd Bratislava 1,
          </Text>
          <Text style={[styles.bankRegister, { color: '#1a1a1a', marginTop: 1, fontSize: 6.8 }]}>
            Oddiel: Sa, Vložka č. 341/B, IČO: 31320155, www.vub.sk
          </Text>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Pobočka:</Text>
            <Text style={styles.metaValue}>{bank?.bank_outlet_id || '55201'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Distribúcia:</Text>
            <Text style={styles.metaValue}>{bank?.bank_distribution_id || 'IB'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const PageSubHeader = ({ bank, client, statement }: any) => {
  return (
    <View style={{ marginBottom: 12 }}>
      {/* Title */}
      <View style={[styles.titleSection, { marginTop: 4, marginBottom: 4 }]}>
        <Text style={styles.title}>{statement.statement_title || 'VÝPIS Z ÚČTU'}</Text>
      </View>

      {/* Account Details block */}
      <View style={{ flexDirection: 'row', marginTop: 2, marginBottom: 4 }}>
        <View style={{ width: '55%' }}>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>Typ:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{client.client_account || 'FLEXI/VÚB ÚČET'}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>Názov:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{client.client_title}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>Číslo:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{client.client_iban}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>BIC:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{client.client_swift}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>Mena:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{statement.statement_currency || 'EUR'}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', width: 60 }}>Pobočka:</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{bank?.bank_outlet_address || 'Svätotrojičné nám. 8, Krupina'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const TransactionsTableHeader = () => (
  <View style={styles.tableHeader}>
    <View style={[styles.colHeaderCol, styles.col1]}>
      <Text style={styles.headerTextNormal}>Zaúčt.</Text>
      <Text style={styles.headerTextNormal}>Realiz.</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col2]}>
      <Text style={styles.headerTextNormal}>Valuta</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col3]}>
      <Text style={styles.headerTextNormal}>Číslo účtu</Text>
      <Text style={styles.headerTextNormal}>Popis transakcie</Text>
      <Text style={styles.headerTextNormal}>Mena/Suma/Kurz</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col4]}>
      <Text style={styles.headerTextSmall}>VS</Text>
      <Text style={styles.headerTextNormal}>Referencia</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col5]}>
      <Text style={styles.headerTextSmall}>KS</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col6]}>
      <Text style={styles.headerTextSmall}>ŠS</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col7]}>
      <Text style={styles.headerTextSmall}>Typ</Text>
      <Text style={styles.headerTextSmall}>popl.</Text>
    </View>
    <View style={[styles.colHeaderCol, styles.col8]}>
      <Text style={styles.headerTextSmall}>Suma</Text>
      <Text style={styles.headerTextSmall}>Poplatok</Text>
    </View>
  </View>
);

const BalancesDetail = ({ balances, statement }: any) => {
  const currency = statement.statement_currency || 'EUR';
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 1, fontFamily: 'Inter' }}>
        ROZPIS POPLATKOV
      </Text>
      <Text style={{ fontSize: 7, color: '#4b5563', marginBottom: 2, fontFamily: 'Inter' }}>
        (OD {statement.period_start || ''} DO {statement.period_end || ''})
      </Text>
      
      <View style={styles.feeTable}>
        <View style={styles.feeTableHeaderRow}>
          <Text style={[styles.feeTableCell, { width: '60%', fontWeight: 'bold' }]}>Popis</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>POČET</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right', fontWeight: 'bold' }]}>CENA</Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right', fontWeight: 'bold' }]}>SUMA V {currency}</Text>
        </View>

        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>Platba platobnou kartou u obchodníka</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>0</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>0,00</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>Výber hotovosti z bankomatu VUB banky</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>1</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>0,00</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>Platba cez TPP/inkaso/okamžitá platba</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>6</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>0,00</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%', fontWeight: 'bold' }]}>Poplatky za platby v rámci konta spolu</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>7</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right', fontWeight: 'bold' }]}>0,00</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>I Prevod cez Internet banking</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>2</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}>0,000</Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}></Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>X Prijaté prevody z iných bánk</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>3</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}>0,000</Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}></Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>L Trvalý prík,inkaso,prevod ATM,autom.prevod</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}>4</Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}>0,220</Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>0,88</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%', fontWeight: 'bold' }]}>Poplatky za platby spolu</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right', fontWeight: 'bold' }]}>0,88</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>Vedenie konta</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>6,00</Text>
        </View>
        <View style={styles.feeTableRow}>
          <Text style={[styles.feeTableCell, { width: '60%' }]}>Ostatné poplatky spolu</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right' }]}>0,00</Text>
        </View>
        <View style={[styles.feeTableRow, { borderBottom: 'none' }]}>
          <Text style={[styles.feeTableCell, { width: '60%', fontWeight: 'bold' }]}>SUMÁR ZAPLATENÝCH POPLATKOV</Text>
          <Text style={[styles.feeTableCell, { width: '15%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '12%', textAlign: 'right' }]}></Text>
          <Text style={[styles.feeTableCell, { width: '13%', textAlign: 'right', fontWeight: 'bold' }]}>{balances.total_fees ? balances.total_fees.toFixed(2).replace('.', ',') : '6,88'}</Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4, fontFamily: 'Cousine' }}>
        <Text style={{ fontSize: 7.5, fontFamily: 'Cousine' }}>Vrátenie poplatkov za predchádzajúci mesiac</Text>
        <Text style={{ fontSize: 7.5, fontFamily: 'Cousine', textAlign: 'right', width: '13%' }}>-6,00</Text>
      </View>
    </View>
  );
};

const LoyaltySection = () => {
  return (
    <View style={{ marginBottom: 5 }}>
      <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, fontFamily: 'Inter' }}>
        Vyhodnotenie Odmeny za vernosť:
      </Text>
      
      <View style={styles.loyaltyTable}>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%' }]}>Obdobie</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>06/22</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%' }]}>Podmienky aktívneho využívania účtu</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}></Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 8 }]}>Súčet kreditov 500 EUR pre VÚB Účet a 1000 EUR pre VÚB Účet Magnifica</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Áno</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 10 }]}>Využitie služby Internet banking / Mobil banking</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Áno</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 10 }]}>Produkty pre získanie Odmeny za vernosť</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}></Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 20 }]}>Spotrebné úvery</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Nie</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 20 }]}>Hypotekárne úvery</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Nie</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 16 }]}>Min. 3 zaúčtované platby kreditnou kartou</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Áno</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 20 }]}>Súčet TP na Sporiaci účet a Investičné sporenie SK v hodnote min. 50 EUR</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Áno</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 20 }]}>Priemerné denné zostatky Eurizon SK fondy, HZL a vkladové produkty vo VÚB - min. 10000 EUR</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Áno</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 20 }]}>Životné poistenie La Vita</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>Nie</Text>
        </View>
        <View style={styles.loyaltyRow}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 10 }]}>Nárok na Odmenu za vernosť 50% zľava z mesačného poplatku</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right' }]}>-</Text>
        </View>
        <View style={[styles.loyaltyRow, { borderBottom: 'none' }]}>
          <Text style={[styles.loyaltyCell, { width: '70%', paddingLeft: 10, fontWeight: 'bold' }]}>Nárok na Odmenu za vernosť 100% zľava z mesačného poplatku</Text>
          <Text style={[styles.loyaltyCell, { width: '30%', textAlign: 'right', fontWeight: 'bold' }]}>Áno</Text>
        </View>
      </View>
    </View>
  );
};

const SavingsSection = () => {
  return (
    <View style={{ marginBottom: 4, borderTop: '0.5px solid #000000', paddingTop: 4, fontFamily: 'Inter' }}>
      <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, fontFamily: 'Inter' }}>
        S FLEXISPORENÍM STE SI NA SPORIACOM ÚČTE NASPORILI ZA MESIAC
      </Text>
      <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, fontFamily: 'Cousine' }}>
        JÚN 2022        0,01 EUR
      </Text>
      <Text style={{ fontSize: 6.5, color: '#4b5563', fontFamily: 'Inter' }}>
        Sumu zaokrúhľovania si môžete kedykoľvek zmeniť na ktorejkoľvek pobočke VUB, alebo na 0850 123 000.
      </Text>
    </View>
  );
};

const OfferSection = () => {
  return (
    <View style={styles.offerBlock}>
      <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, fontFamily: 'Inter' }}>
        VIETE, ŽE... v prípade potreby máte pripravené peniaze na čokoľvek bez formalít?
      </Text>
      <Text style={{ fontSize: 6.8, color: '#4b5563', marginBottom: 2, fontFamily: 'Inter' }}>
        Keďže ste splnili podmienku aktívneho využívania Vášho bežného účtu, bezplatne sme Vám pripravili úverovú ponuku, vďaka ktorej máte prehľad o Vašich úverových možnostiach.
      </Text>
      <Text style={{ fontSize: 7.2, fontWeight: 'bold', marginBottom: 2, fontFamily: 'Inter' }}>
        Aktuálna ponuka, platná do konca mesiaca je:
      </Text>

      <View style={{ marginTop: 4 }}>
        <View style={styles.offerTableRow}>
          <Text style={styles.offerTableCell}>KREDITNÁ KARTA</Text>
          <Text style={[styles.offerTableCell, { fontWeight: 'bold' }]}>do výšky 4000,00 EUR</Text>
        </View>
        <View style={styles.offerTableRow}>
          <Text style={styles.offerTableCell}>alebo FLEXIDEBET</Text>
          <Text style={[styles.offerTableCell, { fontWeight: 'bold' }]}>do výšky 1510,00 EUR</Text>
        </View>
        <View style={styles.offerTableRow}>
          <Text style={styles.offerTableCell}>alebo VÚB PÔŽIČKA</Text>
          <Text style={[styles.offerTableCell, { fontWeight: 'bold' }]}>do výšky 21150,00 EUR</Text>
        </View>
      </View>
      <Text style={{ fontSize: 6.5, color: '#6b7280', marginTop: 4, fontFamily: 'Inter' }}>
        Každý z týchto úverov získate po splnení podmienok stanovených bankou.
      </Text>
    </View>
  );
};

const LegalSection = () => {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 12, lineHeight: 1.3, fontFamily: 'Inter' }}>
        Na tento vklad sa vzťahuje ochrana vkladov podľa zákona č. 118/1996 Z.z. o ochrane vkladov a o zmene a doplnení niektorých zákonov, v znení neskorších predpisov. Podrobnejšie informácie o systéme ochrany vkladov nájdete v informačnom formulári, ktorý ste už dostali alebo Vám bude doručený a ktorý nájdete aj na všetkých obchodných miestach VÚB, a.s., a na internetovej stránke: www.vub.sk.
      </Text>
      
      <View style={{ borderTop: '0.5px solid #000000', paddingTop: 10, marginTop: 15 }}>
        <Text style={{ fontSize: 8.5, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' }}>
          S otázkami a prípadnými zistenými nezrovnalosťami sa obráťte na našu 24-hodinovú telefonickú službu KONTAKT 0850 123 000.
        </Text>
      </View>
    </View>
  );
};

/** Max riadkov pre 2-stranový kompaktný layout (5 + 5 na stranu) */
export const COMPACT_STATEMENT_MAX_TX = 10;
export const COMPACT_FIRST_PAGE_TX = 5;

export const StatementDocument = memo(({ sourceOfTruth }: { sourceOfTruth: any }) => {
  const { bank, client, statement, balances, transactions } = sourceOfTruth;
  const compactLayout = transactions.length <= COMPACT_STATEMENT_MAX_TX;
  const firstPageTxCount = compactLayout ? COMPACT_FIRST_PAGE_TX : 9;

  // Render transactions rows helper for a slice
  const renderTransactionsTableRows = (txSlice: any[], startIndex: number) => {
    return txSlice.map((t: any, idxInSlice: number) => {
      const absoluteIdx = startIndex + idxInSlice;
      const col3Lines = getTransactionLines(t);
      const col4Lines = getTransactionCol4Lines(t);
      const col7Val = getTransactionCol7Value(t);
      
      return (
        <View key={absoluteIdx} style={styles.tableRow}>
          {/* Col 1: Zaúčt. / Realiz. */}
          <View style={[styles.colHeaderCol, styles.col1]}>
            <Text style={{ fontSize: 7.5 }}>{formatShortDate(t.date_booking || t.date_realiz)}</Text>
            <Text style={{ fontSize: 7.5 }}>{formatShortDate(t.date_realiz)}</Text>
          </View>
          
          {/* Col 2: Valuta */}
          <View style={[styles.colHeaderCol, styles.col2]}>
            <Text style={{ fontSize: 7.5 }}>{formatShortDate(t.date_valuta)}</Text>
          </View>
          
          {/* Col 3: Details */}
          <View style={[styles.colHeaderCol, styles.col3]}>
            {col3Lines.map((line, lIdx) => (
              <Text key={lIdx} style={lIdx === 0 && t.account ? styles.txTextBold : styles.txTextMuted}>
                {line}
              </Text>
            ))}
          </View>
          
          {/* Col 4: VS / Ref */}
          <View style={[styles.colHeaderCol, styles.col4]}>
            {col4Lines.map((line, lIdx) => (
              <Text key={lIdx} style={{ fontSize: 7.5 }}>
                {line}
              </Text>
            ))}
          </View>
          
          {/* Col 5: KS */}
          <View style={[styles.colHeaderCol, styles.col5]}>
            <Text style={{ fontSize: 7.5 }}>{t.ks || ''}</Text>
          </View>
          
          {/* Col 6: ŠS */}
          <View style={[styles.colHeaderCol, styles.col6]}>
            <Text style={{ fontSize: 7.5 }}>{t.ss || ''}</Text>
          </View>
          
          {/* Col 7: Typ popl. */}
          <View style={[styles.colHeaderCol, styles.col7]}>
            <Text style={{ fontSize: 7.5 }}>{col7Val}</Text>
          </View>
          
          {/* Col 8: Suma */}
          <View style={[styles.colHeaderCol, styles.col8]}>
            <Text style={[
              styles.txTextBold,
              t.amount >= 0 ? styles.amountCredit : styles.amountDebit,
            ]}>
              {formatAmountValue(t.amount)}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <Document>
      {/* Page 1: Header, Subheader, Summary Table + Address, First 9 Transactions */}
      <Page size="A4" style={styles.page}>
        <PageHeader bank={bank} statement={statement} />
        <PageSubHeader bank={bank} client={client} statement={statement} />
        
        {/* Summary balances and address block */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 }}>
          {/* Summary Table on the left */}
          <View style={{ width: '55%', fontFamily: 'Cousine' }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Cousine' }}>
              Stručný prehľad
            </Text>
            
            <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 3, paddingBottom: 2 }}>
              <View style={{ width: '70%' }}>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold', fontFamily: 'Cousine' }}>Vlastné použiteľné prostriedky v EUR</Text>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold', fontFamily: 'Cousine' }}>k {getDayBefore(statement.period_start)}</Text>
              </View>
              <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '30%', textAlign: 'right', fontFamily: 'Cousine', paddingTop: 4 }}>
                {formatSummaryValue(balances.opening_balance)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 3, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Vklady spolu</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                {formatSummaryValue(balances.total_credit)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', paddingTop: 2, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Výbery spolu</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                {formatSummaryValue(balances.total_debit, true)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 3, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Kreditné úroky</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                0,00
              </Text>
            </View>

            <View style={{ flexDirection: 'row', paddingTop: 2, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Daň</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                0,00
              </Text>
            </View>

            <View style={{ flexDirection: 'row', paddingTop: 2, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Debetné úroky</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                0,00
              </Text>
            </View>

            <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 3, paddingBottom: 2 }}>
              <Text style={{ fontSize: 7.5, width: '70%', fontFamily: 'Cousine' }}>Poplatky spolu</Text>
              <Text style={{ fontSize: 7.5, width: '30%', textAlign: 'right', fontFamily: 'Cousine' }}>
                {formatSummaryValue(balances.total_fees || 0, true)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', borderBottom: '0.5px solid #000000', paddingTop: 3, paddingBottom: 3 }}>
              <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '70%', fontFamily: 'Cousine' }}>
                Vlast. použit. prostr. k {statement.period_end} v EUR
              </Text>
              <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '30%', textAlign: 'right', fontFamily: 'Cousine', paddingTop: 4 }}>
                {formatSummaryValue(balances.closing_balance)}
              </Text>
            </View>
          </View>

          {/* Client Address on the right */}
          <View style={{ width: '40%', paddingLeft: 18, paddingTop: 10 }}>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', marginBottom: 2, lineHeight: 1.15 }}>{client.client_title}</Text>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', marginBottom: 2, lineHeight: 1.15 }}>{client.client_street}</Text>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', lineHeight: 1.15 }}>
              {`${client.client_zip || ''} ${client.client_city || ''}`.trim()}
            </Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.table}>
          <TransactionsTableHeader />
          {renderTransactionsTableRows(transactions.slice(0, firstPageTxCount), 0)}
        </View>

        {/* Side ID text */}
        <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
          VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
        </Text>
      </Page>

      {compactLayout ? (
        /* Kompaktný 2-stranový výpis (≤10 platieb) */
        <Page size="A4" style={styles.page}>
          <PageHeader bank={bank} statement={statement} />
          <PageSubHeader bank={bank} client={client} statement={statement} />

          <View style={styles.table}>
            <TransactionsTableHeader />
            {renderTransactionsTableRows(transactions.slice(firstPageTxCount), firstPageTxCount)}
          </View>

          <View style={{ marginBottom: 10 }} />

          <BalancesDetail balances={balances} statement={statement} />
          <LoyaltySection />
          <SavingsSection />
          <OfferSection />
          <LegalSection />

          <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
            VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
          </Text>
        </Page>
      ) : (
        <>
          {/* Page 2: Header, Subheader, Next 9 Transactions (indices 9 to 17) */}
          <Page size="A4" style={styles.page}>
            <PageHeader bank={bank} statement={statement} />
            <PageSubHeader bank={bank} client={client} statement={statement} />

            <View style={styles.table}>
              <TransactionsTableHeader />
              {renderTransactionsTableRows(transactions.slice(9, 18), 9)}
            </View>

            <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
              VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
            </Text>
          </Page>

          {/* Page 3: Header, Subheader, Transaction index 18, and details sections */}
          <Page size="A4" style={styles.page}>
            <PageHeader bank={bank} statement={statement} />
            <PageSubHeader bank={bank} client={client} statement={statement} />

            <View style={styles.table}>
              <TransactionsTableHeader />
              {renderTransactionsTableRows(transactions.slice(18, 19), 18)}
            </View>

            <View style={{ marginBottom: 15 }} />

            <BalancesDetail balances={balances} statement={statement} />
            <LoyaltySection />
            <SavingsSection />
            <OfferSection />

            <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
              VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
            </Text>
          </Page>

          {/* Page 4: Header, Subheader, Legal Protection Info */}
          <Page size="A4" style={styles.page}>
            <PageHeader bank={bank} statement={statement} />
            <PageSubHeader bank={bank} client={client} statement={statement} />

            <LegalSection />

            <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
              VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
            </Text>
          </Page>
        </>
      )}
    </Document>
  );
});
