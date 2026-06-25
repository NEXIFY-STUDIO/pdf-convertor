import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font, Image, pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Register Cousine font for full Slovak character and punctuation (Latin extended) support
Font.register({
  family: 'Cousine',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cousine/v30/d6lIkaiiRdih4SpP_SQvyQ.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cousine/v30/d6lNkaiiRdih4SpP9Z8K2TnM1w.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Cousine',
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
  col1: { width: '8%' },
  col2: { width: '8%' },
  col3: { width: '40%', paddingRight: 4 },
  col4: { width: '12%' },
  col5: { width: '6%' },
  col6: { width: '6%' },
  col7: { width: '6%' },
  col8: { width: '14%', textAlign: 'right' },
  colHeaderCol: { flexDirection: 'column' },
  headerTextSmall: { fontSize: 6.5, color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 'bold' },
  headerTextNormal: { fontSize: 7.5, color: '#1a1a1a', fontWeight: 'bold' },
  summaryContainer: { marginTop: 10, marginBottom: 10 },
  summaryTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  summaryRowBorder: { borderTop: '1px solid #1a1a1a', marginTop: 1, paddingTop: 1.5 },
  summaryText: { fontSize: 7.5 },
  summaryTextBold: { fontSize: 7.5, fontWeight: 'bold' },
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
              {bank?.bank_logo_image ? (
                <Image src={bank.bank_logo_image} style={{ width: 140, height: 40, objectFit: 'contain', marginLeft: -4, marginBottom: 2 }} />
              ) : (
                <>
                  <Text style={styles.logoTitle}>{bank?.bank_logo_id || 'VÚB BANKA'}</Text>
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
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Pobočka:</Text>
              <Text style={styles.metaValue}>{bank?.bank_outlet_id || ''}</Text>
            </View>
          </View>
        </View>

        {/* Bank Reg Info */}
        <View style={styles.regAndClientRow}>
          <View style={{ width: 350 }}>
            <Text style={styles.bankRegister}>{bank?.bank_register_info || ''}</Text>
          </View>
        </View>

        {/* Main Title and Client ID */}
        <View style={[styles.titleSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15 }]}>
          <Text style={styles.title}>{statement.statement_title || 'VÝPIS Z ÚČTU'}</Text>
          <View style={{ flexDirection: 'row', paddingBottom: 2 }}>
            <Text style={{ color: '#1a1a1a', fontSize: 8.5, fontWeight: 'bold' }}>IČO klienta: </Text>
            <Text style={{ fontSize: 8.5 }}>{client.client_id || ''}</Text>
          </View>
        </View>

        {/* Account Parameters and Address Block */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, minHeight: 70 }}>
          {/* Left: Account info list */}
          <View style={{ width: '50%' }}>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>Názov:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{client.client_title}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>Číslo:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{client.client_iban}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>BIC:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{client.client_swift}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>Mena:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{statement.statement_currency || 'EUR'}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>Typ:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{client.client_account || ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold', width: 60 }}>Pobočka:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{bank?.bank_outlet_address || ''}</Text>
            </View>
          </View>

          {/* Right: Address block */}
          <View style={{ width: '40%', paddingLeft: 10, marginTop: 15 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', marginBottom: 2, lineHeight: 1.15 }}>{client.client_title}</Text>
            <Text style={{ fontSize: 11.5, color: '#1a1a1a', marginBottom: 1, fontWeight: 'bold', lineHeight: 1.15 }}>{client.client_street}</Text>
            <Text style={{ fontSize: 11.5, color: '#1a1a1a', fontWeight: 'bold', lineHeight: 1.15 }}>
              {`${client.client_zip || ''} ${client.client_city || ''}`.trim()}
            </Text>
          </View>
        </View>

        {/* Limits Section */}
        <View style={{ marginTop: 10, marginBottom: 25 }}>
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ fontSize: 7.5, color: '#1a1a1a', width: 180 }}>Limit povoleného prečerpania:</Text>
            <Text style={{ fontSize: 7.5 }}>{client.client_limit || '0,00'}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ fontSize: 7.5, color: '#1a1a1a', width: 180 }}>Platnosť povoleného prečerpania:</Text>
            <Text style={{ fontSize: 7.5 }}></Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ fontSize: 7.5, color: '#1a1a1a', width: 180 }}>Frekvencia výpisov:</Text>
            <Text style={{ fontSize: 7.5 }}>{statement.statement_frequency || ''}</Text>
          </View>
        </View>

        {/* STRUČNÝ PREHĽAD (Summary) */}
        <View style={{ marginTop: 10, marginBottom: 15 }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>Stručný prehľad</Text>
          
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '55%' }}>Účtovný zostatok k začiatku obdobia:</Text>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '45%', textAlign: 'right' }}>{formatMoney(balances.opening_balance)}</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Objem / počet kreditov:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>{formatMoney(balances.total_credit)} / 0</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>- z toho hotovostných:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 / 0</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Objem / počet debetov:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>{formatMoney(balances.total_debit)} / 0</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>- z toho hotovostných:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 / 0</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Kreditný úrok:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Debetný úrok:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Daň:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Poplatky spolu:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '55%' }}>Účtovný zostatok k p. obdobia:</Text>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: '45%', textAlign: 'right' }}>{formatMoney(balances.closing_balance)}</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Disponibilný zostatok:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>{formatMoney(balances.closing_balance)}</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTop: '0.5px solid #000000', paddingTop: 4, paddingBottom: 3 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Priemerný účtovný zostatok:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
          <View style={{ flexDirection: 'row', paddingTop: 2.5, paddingBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, width: '55%' }}>Debetný akumulovaný úrok:</Text>
            <Text style={{ fontSize: 7.5, width: '45%', textAlign: 'right' }}>0,00 EUR</Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.table}>
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

          {transactions.map((t: any, idx: number) => {
            return (
              <View key={idx} style={styles.tableRow}>
                <View style={[styles.colHeaderCol, styles.col1]}>
                  <Text style={{ fontSize: 7.5 }}>{t.date_realiz}</Text>
                  <Text style={{ fontSize: 7.5 }}>{t.date_realiz}</Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col2]}>
                  <Text style={{ fontSize: 7.5 }}>{t.date_valuta}</Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col3]}>
                  <Text style={styles.txTextBold}>{t.account || ''}</Text>
                  <Text style={styles.txTextBold}>{t.popis || ''}</Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col4]}>
                  <Text style={{ fontSize: 7.5 }}>{t.vs || ''}</Text>
                  <Text style={{ fontSize: 7.5 }}></Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col5]}>
                  <Text style={{ fontSize: 7.5 }}>{t.ks || ''}</Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col6]}>
                  <Text style={{ fontSize: 7.5 }}>{t.ss || ''}</Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col7]}>
                  <Text style={{ fontSize: 7.5 }}></Text>
                </View>
                <View style={[styles.colHeaderCol, styles.col8]}>
                  <Text style={[
                    styles.txTextBold,
                    t.amount >= 0 ? styles.amountCredit : styles.amountDebit,
                  ]}>
                    {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer Legal Texts */}
        <View style={{ marginTop: 25, paddingHorizontal: 5 }}>
          <Text style={{ fontSize: 6.5, textAlign: 'justify', marginBottom: 5, lineHeight: 1.1 }}>
            Na tento vklad sa vzťahuje ochrana vkladov podľa zákona č. 118/1996 Z.z. o ochrane vkladov a o zmene a doplnení niektorých zákonov, v znení neskorších predpisov. Podrobnejšie informácie o systéme ochrany vkladov nájdete v informačnom formulári, ktorý ste už dostali alebo Vám bude doručený a ktorý nájdete aj na všetkých obchodných miestach VÚB, a.s., a na internetovej stránke: www.vub.sk.
          </Text>
          <Text style={{ fontSize: 7.5, fontWeight: 'bold', textAlign: 'center', marginTop: 12 }}>
            S otázkami a prípadnými zistenými nezrovnalosťami sa obráťte na našu 24-hodinovú telefonickú službu KONTAKT 0850 123 000.
          </Text>
        </View>

        {/* Side ID text */}
        <Text style={{ position: 'absolute', bottom: 30, left: 15, transformOrigin: 'left bottom', transform: 'rotate(-90deg)', fontSize: 5, letterSpacing: 0.5 }} fixed>
          KORPELE_XDA_20251128322528_120XP.DAT 0000100454444253 PIDS254D
        </Text>
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
    setTransactions,
    // Batch variables
    batchMode,
    batchStatements,
    selectedBatchIndex,
    setSelectedBatchIndex
  } = useAppStore();

  const { bank, client, statement, balances, transactions } = sourceOfTruth;

  const [viewMode, setViewMode] = useState<'pdf' | 'editor'>('pdf');
  
  // Zip Export state
  const [exportingZip, setExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  const handleDownloadZip = async () => {
    if (batchStatements.length === 0) return;
    setExportingZip(true);
    setZipProgress('Spúšťam...');
    try {
      const zip = new JSZip();
      for (let i = 0; i < batchStatements.length; i++) {
        const s = batchStatements[i];
        setZipProgress(`PDF ${i + 1}/${batchStatements.length}`);
        const blob = await pdf(<StatementDocument sourceOfTruth={s} />).toBlob();
        const safeName = s.statement.statement_number?.replace(/\//g, '_') || `vypis_${i + 1}`;
        zip.file(`Vypis_${safeName}.pdf`, blob);
      }
      setZipProgress('Komprimujem...');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `VUB_Vypisy_Batch_${batchStatements.length}_mesiacov.zip`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Chyba pri generovaní ZIP archívu.');
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
          <PDFViewer className="ft-pdf-viewer">
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
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.total_credit)} / 0</span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}></span>
                </div>
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>- z toho hotovostných:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}></span>
                  <span style={{ fontSize: '7.5px', width: '25%', textAlign: 'right' }}>0,00 / 0</span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', paddingTop: '2px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Objem / počet debetov:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>{formatMoney(balances.total_debit)} / 0</span>
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
                <div style={{ display: 'flex', paddingTop: '1.5px', paddingBottom: '1.5px' }}>
                  <span style={{ fontSize: '7.5px', width: '55%' }}>Poplatky spolu:</span>
                  <span style={{ fontSize: '7.5px', width: '20%', textAlign: 'right' }}>0,00 EUR</span>
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
                          <div style={{ fontSize: '7.5px' }}>{t.date_realiz}</div>
                          <div style={{ fontSize: '7.5px' }}>{t.date_realiz}</div>
                        </td>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '7.5px' }}>{t.date_valuta}</div>
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
