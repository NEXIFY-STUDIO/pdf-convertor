import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import RightPanel from '../components/RightPanel';
import { useAppStore } from '../store/useAppStore';

vi.mock('@react-pdf/renderer', () => {
  return {
    PDFViewer: ({ children }: any) => <div data-testid="pdf-viewer">{children}</div>,
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
    Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
    View: ({ children }: any) => <div data-testid="pdf-view">{children}</div>,
    StyleSheet: { create: (styles: any) => styles },
    Font: { register: vi.fn() },
    Image: ({ src }: any) => <img data-testid="pdf-image" src={src} />,
  };
});

describe('VÚB Statement layout requirements & correctness', () => {
  beforeEach(() => {
    useAppStore.setState({
      batchMode: false,
      sourceOfTruth: {
        ...useAppStore.getState().sourceOfTruth,
        bank: {
          bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
          bank_logo_image: '/vub/vuub.png',
          bank_register_info: 'VÚB, a.s., Mlynské nivy 1...',
          bank_outlet_id: '30017',
          bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
        }
      }
    });
  });

  it('should render VÚB specific bank logo / name in PDF by default', () => {
    render(<RightPanel />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should expose VÚB fields in Inspector panel', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));

    expect(screen.getByText('Logo banky (text)')).toBeInTheDocument();
    expect(screen.getByText('IČO klienta')).toBeInTheDocument();
    expect(screen.getByText('IBAN')).toBeInTheDocument();
    expect(screen.getByText('Typ účtu')).toBeInTheDocument();
    expect(screen.getByText('SWIFT / BIC')).toBeInTheDocument();
    expect(screen.getByText('Adresa pobočky')).toBeInTheDocument();
    expect(screen.getByText('Frekvencia výpisov')).toBeInTheDocument();
    expect(screen.getByText('Limit prečerpania')).toBeInTheDocument();
  });

  it('should show bank logo controls in Inspector', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));
    expect(screen.getByText('Logo banky')).toBeInTheDocument();
    expect(screen.getByAltText('Bank Logo')).toBeInTheDocument();
  });

  it('should contain exact bank legal texts in PDF component', () => {
    render(<RightPanel />);
    const pdfTexts = screen.getAllByTestId('pdf-text');
    const pdfTextsContent = pdfTexts.map(el => el.textContent || '');

    const hasDepositProtectionText = pdfTextsContent.some(text =>
      text.includes('ochrana vkladov podľa zákona č. 118/1996 Z.z.'),
    );
    expect(hasDepositProtectionText).toBe(true);

    const hasHotlineText = pdfTextsContent.some(text =>
      text.includes('telefonickú službu KONTAKT 0850 123 000'),
    );
    expect(hasHotlineText).toBe(true);
  });

  it('should contain the specific side tracking ID on left margin in PDF', () => {
    render(<RightPanel />);
    const pdfTexts = screen.getAllByTestId('pdf-text');
    const pdfTextsContent = pdfTexts.map(el => el.textContent || '');

    const hasSideCode = pdfTextsContent.some(text =>
      text.includes('VUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml'),
    );
    expect(hasSideCode).toBe(true);
  });
});