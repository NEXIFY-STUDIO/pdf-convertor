import { useState, useEffect, memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAppStore } from '../store/useAppStore';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font, Image, pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ============================================
// 1. FONT REGISTRATION (DejaVu Sans for Slovak diacritics)
// ============================================
Font.register({
  family: 'DejaVu Sans',
  fonts: [
    { src: '/fonts/DejaVuSans.ttf', fontWeight: 400 },
    { src: '/fonts/DejaVuSans-Bold.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'DejaVu Sans Mono',
  fonts: [
    { src: '/fonts/DejaVuSansMono.ttf', fontWeight: 400 },
    { src: '/fonts/DejaVuSansMono-Bold.ttf', fontWeight: 700 },
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

const getTransactionLines = (t: any, idx: number) => {
  const lines: string[] = [];
  const bicMap: Record<string, string> = {
    '0200': 'SUBASKBX',
    '6500': 'POBNSKBA',
    '0900': 'GIBASKBX',
    '5600': 'KOMASK2X',
    '1111': 'UNCRSKBX',
    '8180': 'SPSRSKBAXXX',
    '1100': 'TATRSKBX'
  };

  const getBic = (iban?: string) => {
    if (!iban) return '';
    const bankCode = iban.substring(4, 8);
    return bicMap[bankCode] || '';
  };

  const formatIbanWithSpaces = (iban?: string) => {
    if (!iban) return '';
    const clean = iban.replace(/\s/g, '');
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const accountFormatted = formatIbanWithSpaces(t.account);

  const getPayerRef = () => {
    if (t.vs === undefined && t.ss === undefined && t.ks === undefined) return '';
    if (!t.vs && !t.ss && !t.ks) return 'Neuvedené';
    const vs = t.vs || '';
    const ss = t.ss || '';
    const ks = t.ks || '';
    return `/VS${vs}/SS${ss}/KS${ks}`;
  };

  if (idx === 0) {
    lines.push(accountFormatted);
    lines.push('ZSE ENERGIA, A.S.');
    lines.push('Názov: elektrika');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
  } 
  else if (idx === 1) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod/NonSEPAPrevod');
    lines.push('Názov: dom dan');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
  } 
  else if (idx === 2) {
    lines.push('VÝBER HOTOVOSTI     KARTA:*0935');
    lines.push('S6AV152F         LEVICE    15:18');
  } 
  else if (idx === 3) {
    lines.push('Zľava z poplatku');
  } 
  else if (idx === 4) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod');
    lines.push('Názov: Peter Kupča');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push('Referencia platiteľa: Neuvedené');
    lines.push('Účel platby: /DO2022-07-10/SP');
  } 
  else if (idx === 5) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod');
    lines.push('Názov: ZS A MS HRONSKE KLAC');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: /VS9/SS/KS${t.ks || ''}`);
    lines.push('Účel platby: /DO2022-07-08/SP');
  } 
  else if (idx === 6) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod/NonSEPAPrevod');
    lines.push('Názov: strava');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push('Referencia platiteľa: Neuvedené');
  } 
  else if (idx === 7) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod/NonSEPAPrevod');
    lines.push('Názov: AXA II');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
  } 
  else if (idx === 8) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod/NonSEPAPrevod');
    lines.push('Názov: AXA progresia');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
  } 
  else if (idx === 9) {
    lines.push(accountFormatted);
    lines.push('AXA');
    lines.push('Názov: axa');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
    lines.push('Účel platby: AXA');
  } 
  else if (idx === 10) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod');
    lines.push('Názov: Úrad práce, sociálnych vecí a rodiny Levice');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: /VS7551027847/SS0220712402/KS4218`);
    lines.push('Účel platby: /DO2022-07-14/SP');
  } 
  else if (idx === 11) {
    lines.push(accountFormatted);
    lines.push('Kupcova Monika');
    lines.push('Názov: ORANGE SLOVENSKO A.S');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push('CID príjemcu: SK80ZZZ70000000088');
    lines.push('Referencia súhlasu: 0019439439');
    lines.push('Typ inkasa: C');
    lines.push('Sekvencia inkasa: RCUR');
    lines.push(`Referencia platiteľa: /VS0019439439/SS1204878744/KS0308`);
  } 
  else if (idx === 12) {
    lines.push(accountFormatted);
    lines.push('SEPA Europrevod/NonSEPAPrevod');
    lines.push('Názov: plyn');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
  } 
  else if (idx === 13) {
    lines.push(accountFormatted);
    lines.push('*KOOPERATIVA A.S.');
    lines.push('Názov: kooperativa');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
    lines.push('Konečný príjemca: KOOPERATIVA A.S.');
  } 
  else if (idx === 14) {
    lines.push(accountFormatted);
    lines.push('SEPA inkaso');
    lines.push('Názov: Slovak Telekom, a.s.');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push('CID príjemcu: SK19ZZZ70000000022');
    lines.push('Referencia súhlasu: S1000335460');
    lines.push('Typ inkasa: C');
    lines.push('Sekvencia inkasa: RCUR');
    lines.push(`Referencia platiteľa: /VS8308456132/SS4551534098/KS0308`);
    lines.push('Účel platby: /FOR//INV/8308456132 30.6.2022/INV/8308456132 30.6.2022');
    lines.push('Kód účelu platby: OTHR');
  } 
  else if (idx === 15) {
    lines.push(accountFormatted);
    lines.push('MONIKA KUPČOVÁ');
    lines.push('Názov: Sporiacii');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push('Referencia platiteľa: Neuvedené');
  } 
  else if (idx === 16) {
    lines.push(accountFormatted);
    lines.push('Zaplatenie dlznej sumy');
    lines.push('Názov: Splatka kreditnej karty');
    lines.push(`BIC: ${getBic(t.account)}`);
    lines.push(`Referencia platiteľa: ${getPayerRef()}`);
    lines.push('Účel platby: Zaplatenie dlznej sumy');
  } 
  else if (idx === 17) {
    lines.push('Vedenie konta');
  } 
  else if (idx === 18) {
    lines.push('Poplatky za platby nad rámec konta');
  }
  
  return lines;
};

const getTransactionCol4Lines = (t: any, idx: number) => {
  const bankRefs = [
    '18071823AJIBR',
    '2207030EONIBR',
    '0507229280627',
    '08070002155BP',
    'FSY0019214558',
    '2022-07-08/O0',
    '1809090WR2IBR',
    '20030812QJIBR',
    '21122318IPIBR',
    '1907042IJOIBR',
    '655295-202207',
    'PI22071111667',
    '190916316JIBR',
    '181081420052T',
    '2219939698151',
    '1607250I7WIBR',
    '22072728W3IBR',
    '2907IG0059095',
    '2907IG0059096'
  ];

  const lines: string[] = [];
  const vs = t.vs || '';
  const bankRef = bankRefs[idx] || '';

  if (idx === 2) {
    lines.push('');
    lines.push(bankRef);
  } else {
    lines.push(vs);
    lines.push(bankRef);
  }
  return lines;
};

const getTransactionCol7Value = (_t: any, idx: number) => {
  const typMap: Record<number, string> = {
    1: 'I',
    4: 'X',
    5: 'X',
    11: 'L',
    12: 'L',
    13: 'L',
    14: 'L',
    15: 'L',
    16: 'I'
  };
  return typMap[idx] || '';
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

export const StatementDocument = memo(({ sourceOfTruth }: { sourceOfTruth: any }) => {
  const { bank, client, statement, balances, transactions } = sourceOfTruth;

  // Render transactions rows helper for a slice
  const renderTransactionsTableRows = (txSlice: any[], startIndex: number) => {
    return txSlice.map((t: any, idxInSlice: number) => {
      const absoluteIdx = startIndex + idxInSlice;
      const col3Lines = getTransactionLines(t, absoluteIdx);
      const col4Lines = getTransactionCol4Lines(t, absoluteIdx);
      const col7Val = getTransactionCol7Value(t, absoluteIdx);
      
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
          {renderTransactionsTableRows(transactions.slice(0, 9), 0)}
        </View>

        {/* Side ID text */}
        <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
          VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
        </Text>
      </Page>

      {/* Page 2: Header, Subheader, Next 9 Transactions (indices 9 to 17) */}
      <Page size="A4" style={styles.page}>
        <PageHeader bank={bank} statement={statement} />
        <PageSubHeader bank={bank} client={client} statement={statement} />
        
        <View style={styles.table}>
          <TransactionsTableHeader />
          {renderTransactionsTableRows(transactions.slice(9, 18), 9)}
        </View>

        {/* Side ID text */}
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

        {/* Extra spacing after the single transaction row */}
        <View style={{ marginBottom: 15 }} />

        <BalancesDetail balances={balances} statement={statement} />
        <LoyaltySection />
        <SavingsSection />
        <OfferSection />

        {/* Side ID text */}
        <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
          VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
        </Text>
      </Page>

      {/* Page 4: Header, Subheader, Legal Protection Info */}
      <Page size="A4" style={styles.page}>
        <PageHeader bank={bank} statement={statement} />
        <PageSubHeader bank={bank} client={client} statement={statement} />
        
        <LegalSection />

        {/* Side ID text */}
        <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
          VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D
        </Text>
      </Page>
    </Document>
  );
});
export default function RightPanel() {
  // Granular Zustand selectors to prevent unnecessary re-renders
  const sourceOfTruth = useAppStore(state => state.sourceOfTruth, shallow);
  const setBankData = useAppStore(state => state.setBankData);
  const setClientData = useAppStore(state => state.setClientData);
  const setStatementData = useAppStore(state => state.setStatementData);
  const setOpeningBalance = useAppStore(state => state.setOpeningBalance);
  const setTransactions = useAppStore(state => state.setTransactions);
  
  // Batch state selectors
  const batchMode = useAppStore(state => state.batchMode);
  const batchStatements = useAppStore(state => state.batchStatements, shallow);
  const selectedBatchIndex = useAppStore(state => state.selectedBatchIndex);
  const setSelectedBatchIndex = useAppStore(state => state.setSelectedBatchIndex);

  const { bank, client, statement, balances, transactions } = sourceOfTruth;

  const [viewMode, setViewMode] = useState<'pdf' | 'editor'>('pdf');
  
  // Zip Export state
  const [exportingZip, setExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  // Memory-safe batched PDF generation for ZIP export
  // Processes PDFs in chunks to prevent OOM with large batches (12+ months)
  const BATCH_SIZE = 3; // Process 3 PDFs at a time

  const checkMemoryBeforeExport = (): boolean => {
    if (typeof window === 'undefined') return true;

    // Estimate: 1 month ≈ 5MB PDF + overhead
    const estimatedMemory = batchStatements.length * 5 * 1.5; // MB
    
    // Check available memory (non-standard API, only available in some browsers)
    // @ts-ignore - performance.memory is non-standard but available in Chrome/Edge
    if (window.performance && window.performance.memory) {
      // @ts-ignore
      const availableMB = window.performance.memory.jsHeapSizeLimit / 1024 / 1024;
      if (estimatedMemory > availableMB * 0.7) {
        alert(`Varovanie: Nedostatok pamäte! Odporúča sa generovať max. ${Math.floor(availableMB * 0.7 / 7.5)} výpisov naraz.`);
        return false;
      }
    }
    
    // Warn for very large batches
    if (batchStatements.length > 24) {
      return confirm(`Varovanie: Generujete ${batchStatements.length} výpisov. Odporúča sa max. 12 naraz. Pokračovať?`);
    }
    
    return true;
  };

  const handleDownloadZip = async () => {
    if (batchStatements.length === 0) return;
    
    // Check memory before starting
    if (!checkMemoryBeforeExport()) {
      setExportingZip(false);
      setZipProgress('');
      return;
    }

    setExportingZip(true);
    setZipProgress('Inicializácia...');
    
    try {
      const zip = new JSZip();
      const total = batchStatements.length;

      // Process in batches to limit memory usage
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = batchStatements.slice(i, i + BATCH_SIZE);
        
        // Process chunk in parallel
        const pdfPromises = chunk.map(async (s, idxInChunk) => {
          const absoluteIdx = i + idxInChunk;
          setZipProgress(`Generujem ${absoluteIdx + 1}/${total}`);
          
          const blob = await pdf(<StatementDocument sourceOfTruth={s} />).toBlob();
          const safeName = s.statement.statement_number?.replace(/\//g, '_') || `vypis_${absoluteIdx + 1}`;
          
          return { 
            name: `Vypis_${safeName}.pdf`,
            blob,
            absoluteIdx 
          };
        });

        const results = await Promise.all(pdfPromises);
        
        // Add files to ZIP and dereference blobs
        results.forEach(({ name, blob }) => {
          zip.file(name, blob, { binary: true });
          // Blob is now owned by JSZip, original reference can be GC'd
        });
      }

      setZipProgress('Komprimujem...');
      const content = await zip.generateAsync({ 
        type: 'blob', 
        streamFiles: true,  // Enable streaming for large files
        compression: 'DEFLATE', 
        compressionOptions: { level: 6 }  // Balance speed vs compression
      });

      saveAs(content, `VUB_Vypisy_Batch_${total}_mesiacov.zip`);
      
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Chyba pri generovaní ZIP archívu. Skúste zmeniť počet mesiacov alebo zreštartujte aplikáciu.');
    } finally {
      setExportingZip(false);
      setZipProgress('');
    }
  };
  
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = () => {
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBankData({ bank_logo_image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };
  
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
    date_booking: '',
    date_valuta: '',
    popis: '',
    vs: '',
    ks: '',
    ss: '',
    account: '',
    amount: '0',
    is_fee: false
  });

  // Keep transaction edit form in sync with chosen index
  useEffect(() => {
    if (editingTxIndex !== null && transactions[editingTxIndex]) {
      const tx = transactions[editingTxIndex];
      setTxEditData({
        date_realiz: tx.date_realiz || '',
        date_booking: tx.date_booking || tx.date_realiz || '',
        date_valuta: tx.date_valuta || '',
        popis: tx.popis || '',
        vs: tx.vs || '',
        ks: tx.ks || '',
        ss: tx.ss || '',
        account: tx.account || '',
        amount: tx.amount.toString(),
        is_fee: tx.is_fee || false
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
      date_booking: txEditData.date_booking,
      date_valuta: txEditData.date_valuta,
      popis: txEditData.popis,
      vs: txEditData.vs || undefined,
      ks: txEditData.ks || undefined,
      ss: txEditData.ss || undefined,
      account: txEditData.account || undefined,
      amount: isNaN(parsedAmount) ? 0 : parsedAmount,
      is_fee: txEditData.is_fee,
      type: txEditData.is_fee ? 'fee' : (parsedAmount >= 0 ? 'incoming' : 'outgoing')
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

      {batchMode && batchStatements.length > 0 && (
        <div style={{ padding: '0.75rem 1.125rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Vygenerované výpisy ({batchStatements.length} mesiacov) {zipProgress && <span style={{ color: 'var(--color-primary)', marginLeft: '10px', fontSize: '0.7rem', textTransform: 'none', fontWeight: 'normal' }}>({zipProgress})</span>}
            </span>
            <button
              className="ft-btn ft-btn-primary ft-btn-sm"
              onClick={handleDownloadZip}
              disabled={exportingZip}
              style={{ fontSize: '0.7rem', padding: '4px 10px' }}
            >
              {exportingZip ? 'Exportujem...' : 'Exportovať všetky do ZIP'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
            {batchStatements.map((s, idx) => {
              const isSelected = selectedBatchIndex === idx;
              return (
                <button
                  key={idx}
                  className={`ft-btn ${isSelected ? 'ft-btn-primary' : 'ft-btn-ghost'} ft-btn-sm`}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center', minWidth: 'fit-content' }}
                  onClick={() => setSelectedBatchIndex(idx)}
                >
                  <span>{s.statement.statement_month}/{s.statement.statement_year}</span>
                  <span style={{ fontSize: '0.65rem', opacity: isSelected ? 0.9 : 0.6, fontFamily: 'var(--font-mono)' }}>
                    ({s.balances.closing_balance.toFixed(2)} €)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="ft-preview-body">
        {viewMode === 'pdf' ? (
          <PDFViewer 
            key={`${sourceOfTruth.statement.statement_month}-${sourceOfTruth.statement.statement_year}-${sourceOfTruth.balances.opening_balance}-${sourceOfTruth.balances.closing_balance}`}
            className="ft-pdf-viewer"
          >
            <StatementDocument sourceOfTruth={sourceOfTruth} />
          </PDFViewer>
        ) : (
          <div className="ft-html-sheet-container">
            <div className="ft-html-sheet">
              {/* Upper Row: Logo & Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ width: '220px' }}>
                  <div 
                    className={`ft-mirror-logo-box ${isDraggingLogo ? 'ft-logo-drag-over' : ''}`}
                    onDragOver={handleLogoDragOver}
                    onDragLeave={handleLogoDragLeave}
                    onDrop={handleLogoDrop}
                    style={{ position: 'relative', border: isDraggingLogo ? '1.5px dashed #3b82f6' : 'none', padding: isDraggingLogo ? '6px 10px' : '0', marginBottom: '4px' }}
                    title={bank?.bank_logo_image ? "Pravý klik pre odstránenie loga · Klik pre zmenu" : "Kliknite alebo pretiahnite sem obrázok pre zmenu loga (PNG/JPG)"}
                  >
                    <div style={{ position: 'relative' }}>
                      {bank?.bank_logo_image ? (
                        <div 
                          className="ft-mirror-editable"
                          style={{ cursor: 'pointer' }}
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm('Chcete odstrániť obrázkové logo?')) {
                              setBankData({ bank_logo_image: undefined });
                            }
                          }}
                        >
                          <img 
                            src={bank.bank_logo_image} 
                            alt="Bank Logo" 
                            style={{ maxHeight: '31.2px', maxWidth: '100%', objectFit: 'contain', marginBottom: '2px', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <>
                          <div 
                            className="ft-mirror-logo-title ft-mirror-editable"
                            onClick={() => handleEditField('bank', 'bank_logo_id', 'Logo banky', bank?.bank_logo_id || '')}
                          >
                            {bank?.bank_logo_id || 'VÚB BANKA'}
                          </div>
                          <div className="ft-logo-hint" style={{ fontSize: '7px', color: '#9ca3af', marginTop: '2px', cursor: 'pointer' }} onClick={() => document.getElementById('logo-upload')?.click()}>
                            Kliknite alebo presuňte sem logo
                          </div>
                          {isDraggingLogo && (
                            <div style={{ position: 'absolute', inset: -5, backgroundColor: 'rgba(59, 130, 246, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 'bold', borderRadius: '4px', zIndex: 10 }}>
                              PUSTITE OBRÁZOK TU
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Hidden File Input for click-to-upload */}
                      <input 
                        type="file" 
                        id="logo-upload" 
                        accept="image/png, image/jpeg, image/svg+xml" 
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setBankData({ bank_logo_image: event.target.result.toString() });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          // reset input
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {!bank?.bank_logo_image && (
                      <div className="ft-mirror-logo-sub">Intesa Sanpaolo Group</div>
                    )}
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

              {/* Client ID Row and Main Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px', marginBottom: '5px' }}>
                <div 
                  className="ft-mirror-title-section ft-mirror-editable"
                  style={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '0' }}
                  onClick={() => handleEditField('statement', 'statement_title', 'Titulok výpisu', statement.statement_title || '')}
                >
                  {statement.statement_title || 'VÝPIS Z ÚČTU'}
                </div>
                <div style={{ display: 'flex', gap: '4px', paddingBottom: '2px' }}>
                  <span style={{ color: '#1a1a1a', fontSize: '8.5px', fontWeight: 'bold' }}>IČO klienta:</span>
                  <span 
                    style={{ fontWeight: 'bold', fontSize: '8.5px' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_id', 'IČO klienta', client.client_id || '')}
                  >
                    {client.client_id || ''}
                  </span>
                </div>
              </div>

              {/* Account Parameters and Address Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', minHeight: '70px' }}>
                {/* Left: Account info list */}
                <div style={{ width: '50%' }}>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>Názov:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('client', 'client_title', 'Názov majiteľa účtu', client.client_title || '')}
                    >
                      {client.client_title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>Číslo:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('client', 'client_iban', 'IBAN / Číslo účtu', client.client_iban || '')}
                    >
                      {client.client_iban}
                    </span>
                  </div>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>BIC:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('client', 'client_swift', 'SWIFT BIC kód', client.client_swift || '')}
                    >
                      {client.client_swift}
                    </span>
                  </div>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>Mena:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('statement', 'statement_currency', 'Mena výpisu', statement.statement_currency || '')}
                    >
                      {statement.statement_currency || 'EUR'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>Typ:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('client', 'client_account', 'Typ účtu', client.client_account || '')}
                    >
                      {client.client_account || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', fontSize: '8.5px', marginBottom: '2px' }}>
                    <span style={{ width: '60px', fontWeight: 'bold' }}>Pobočka:</span>
                    <span 
                      style={{ fontWeight: 'bold', flex: 1 }} 
                      className="ft-mirror-editable"
                      onClick={() => handleEditField('bank', 'bank_outlet_address', 'Adresa pobočky', bank?.bank_outlet_address || '')}
                    >
                      {bank?.bank_outlet_address || ''}
                    </span>
                  </div>
                </div>

                {/* Right: Address block */}
                <div style={{ width: '40%', paddingLeft: '10px', marginTop: '25px', display: 'flex', flexDirection: 'column' }}>
                  <div 
                    style={{ fontSize: '9.5px', fontWeight: 'bold', marginBottom: '2px' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_title', 'Meno/Názov adresáta', client.client_title || '')}
                  >
                    {client.client_title}
                  </div>
                  <div 
                    style={{ fontSize: '9.5px', color: '#1a1a1a', marginBottom: '1px', fontWeight: 'bold' }} 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_street', 'Ulica a číslo', client.client_street || '')}
                  >
                    {client.client_street}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#1a1a1a', fontWeight: 'bold' }}>
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

              {/* Limits Section */}
              <div style={{ marginTop: '10px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', fontSize: '7.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#1a1a1a', width: '180px' }}>Limit povoleného prečerpania:</span>
                  <span 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('client', 'client_limit', 'Limit povoleného prečerpania', client.client_limit || '')}
                  >
                    {client.client_limit || '0,00'}
                  </span>
                </div>
                <div style={{ display: 'flex', fontSize: '7.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#1a1a1a', width: '180px' }}>Platnosť povoleného prečerpania:</span>
                  <span></span>
                </div>
                <div style={{ display: 'flex', fontSize: '7.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#1a1a1a', width: '180px' }}>Frekvencia výpisov:</span>
                  <span 
                    className="ft-mirror-editable"
                    onClick={() => handleEditField('statement', 'statement_frequency', 'Frekvencia generovania výpisov', statement.statement_frequency || '')}
                  >
                    {statement.statement_frequency || ''}
                  </span>
                </div>
              </div>

              {/* STRUČNÝ PREHĽAD (Summary) */}
              <div style={{ marginTop: '10px', marginBottom: '15px' }}>
                <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Stručný prehľad</div>
                
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 'bold', width: '55%' }}>Účtovný zostatok k začiatku obdobia:</span>
                  <span style={{ fontSize: '7.5px', fontWeight: 'bold', width: '20%', textAlign: 'right' }}>{formatMoney(balances.opening_balance)}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Objem / počet kreditov:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.total_credit)} / {transactions.filter((t: any) => t.amount >= 0 && !t.is_fee).length}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>- z toho hotovostných:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}></span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}>0,00 / 0</span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Objem / počet debetov:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.total_debit)} / {transactions.filter((t: any) => t.amount < 0 && !t.is_fee).length}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>- z toho hotovostných:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}></span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}>0,00 / 0</span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Kreditný úrok:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Debetný úrok:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Daň:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px', borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Poplatky spolu:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.total_fees || 0)} / {transactions.filter((t: any) => t.is_fee).length}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 'bold', width: '55%' }}>Účtovný zostatok k p. obdobia:</span>
                  <span style={{ fontSize: '7.5px', fontWeight: 'bold', width: '20%', textAlign: 'right' }}>{formatMoney(balances.closing_balance)}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Disponibilný zostatok:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.closing_balance)}</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Priemerný účtovný zostatok:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Debetný akumulovaný úrok:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
              </div>

              {/* Transactions Table */}
              <table style={{ width: '100%', marginTop: '5px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', background: '#fafafa' }}>
                    <th style={{ width: '8%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '7.5px' }}>Zaúčt.</div>
                      <div style={{ fontSize: '7.5px' }}>Realiz.</div>
                    </th>
                    <th style={{ width: '8%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '7.5px' }}>Valuta</div>
                    </th>
                    <th style={{ width: '40%', padding: '4px', paddingRight: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '7.5px' }}>Číslo účtu</div>
                      <div style={{ fontSize: '7.5px' }}>Popis transakcie</div>
                      <div style={{ fontSize: '7.5px' }}>Mena/Suma/Kurz</div>
                    </th>
                    <th style={{ width: '12%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '6.5px' }}>VS</div>
                      <div style={{ fontSize: '7.5px' }}>Referencia</div>
                    </th>
                    <th style={{ width: '6%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '6.5px' }}>KS</div>
                    </th>
                    <th style={{ width: '6%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '6.5px' }}>ŠS</div>
                    </th>
                    <th style={{ width: '6%', padding: '4px', textAlign: 'left', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '6.5px' }}>Typ</div>
                      <div style={{ fontSize: '6.5px' }}>popl.</div>
                    </th>
                    <th style={{ width: '14%', padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#1a1a1a' }}>
                      <div style={{ fontSize: '6.5px' }}>Suma</div>
                      <div style={{ fontSize: '6.5px' }}>Poplatok</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: any, idx: number) => {
                    return (
                      <tr 
                        key={idx} 
                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                        className="ft-mirror-editable-row"
                        onClick={() => setEditingTxIndex(idx)}
                      >
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{formatShortDate(t.date_booking || t.date_realiz)}</div>
                          <div style={{ fontSize: '7.5px' }}>{formatShortDate(t.date_realiz)}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{formatShortDate(t.date_valuta)}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '8px' }}>{t.account || ''}</div>
                          <div style={{ fontWeight: 'bold', fontSize: '8px' }}>{t.popis || ''}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{t.vs || ''}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{t.ks || ''}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{t.ss || ''}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}></div>
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1a1a1a' }}>
                            {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

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
                  <label htmlFor="tx-booking" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Zaúčtované</label>
                  <input
                    id="tx-booking"
                    type="text"
                    className="ft-input"
                    value={txEditData.date_booking}
                    onChange={(e) => setTxEditData({ ...txEditData, date_booking: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tx-realiz" className="ft-label" style={{ marginBottom: '4px', display: 'block' }}>Realizované</label>
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                  <input
                    id="tx-fee"
                    type="checkbox"
                    checked={txEditData.is_fee}
                    onChange={(e) => setTxEditData({ ...txEditData, is_fee: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="tx-fee" className="ft-label" style={{ cursor: 'pointer', marginBottom: '0' }}>Poplatok banky</label>
                </div>
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
