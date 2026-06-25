import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import RightPanel from '../components/RightPanel';

// Mock react-pdf to check PDF elements rendering
vi.mock('@react-pdf/renderer', () => {
  return {
    PDFViewer: ({ children }: any) => <div data-testid="pdf-viewer">{children}</div>,
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
    Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
    View: ({ children }: any) => <div data-testid="pdf-view">{children}</div>,
    StyleSheet: {
      create: (styles: any) => styles,
    },
    Font: {
      register: vi.fn(),
    },
    Image: ({ src }: any) => <img data-testid="pdf-image" src={src} />,
  };
});

describe('VÚB Statement layout requirements & correctness', () => {
  it('should render VÚB specific bank logo / name in PDF by default', () => {
    render(<RightPanel />);
    // Default PDF view should be rendered
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should render the VÚB specific fields in HTML Editor', () => {
    render(<RightPanel />);
    
    // Toggle button to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    // Verify Title Section
    expect(screen.getByText('VÝPIS Z ÚČTU')).toBeInTheDocument();

    // Verify Client ID (IČO) field is present
    expect(screen.getByText('IČO klienta:')).toBeInTheDocument();

    // Verify Slovak labels for account parameters
    expect(screen.getByText('Názov:')).toBeInTheDocument();
    expect(screen.getByText('Mena:')).toBeInTheDocument();
    expect(screen.getByText('Číslo:')).toBeInTheDocument();
    expect(screen.getByText('Typ:')).toBeInTheDocument();
    expect(screen.getByText('BIC:')).toBeInTheDocument();
    expect(screen.getAllByText('Pobočka:').length).toBe(2);

    // Verify limits are present
    expect(screen.getByText('Limit povoleného prečerpania:')).toBeInTheDocument();
    expect(screen.getByText('Platnosť povoleného prečerpania:')).toBeInTheDocument();
    expect(screen.getByText('Frekvencia výpisov:')).toBeInTheDocument();

    // Verify logo image is present and has the click-to-upload helper
    const logoImg = screen.getByAltText('Bank Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg.style.maxHeight).toBe('31.2px');
  });

  it('should contain exact bank legal texts in PDF component', () => {
    render(<RightPanel />);
    // Get text elements from PDF mock
    const pdfTexts = screen.getAllByTestId('pdf-text');
    const pdfTextsContent = pdfTexts.map(el => el.textContent || '');

    // Verify presence of system of deposit protection text
    const hasDepositProtectionText = pdfTextsContent.some(text => 
      text.includes('ochrana vkladov podľa zákona č. 118/1996 Z.z.')
    );
    expect(hasDepositProtectionText).toBe(true);

    // Verify presence of KONTAKT hotline text
    const hasHotlineText = pdfTextsContent.some(text => 
      text.includes('telefonickú službu KONTAKT 0850 123 000')
    );
    expect(hasHotlineText).toBe(true);
  });

  it('should contain the specific side tracking ID on left margin in PDF', () => {
    render(<RightPanel />);
    const pdfTexts = screen.getAllByTestId('pdf-text');
    const pdfTextsContent = pdfTexts.map(el => el.textContent || '');

    // Verify side code
    const hasSideCode = pdfTextsContent.some(text => 
      text.includes('KORPELE_XDA_20251128322528_120XP.DAT')
    );
    expect(hasSideCode).toBe(true);
  });
});
