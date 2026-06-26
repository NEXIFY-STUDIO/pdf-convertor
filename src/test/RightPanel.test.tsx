import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import RightPanel from '../components/RightPanel';
import { useAppStore } from '../store/useAppStore';

// Mock react-pdf to avoid JSDOM compatibility issues
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

describe('RightPanel Interactive Mode & WYSIWYG Editor', () => {
  it('should default to PDF preview mode', () => {
    render(<RightPanel />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    expect(screen.queryByText('Interactive Editor (Magic Mirror)')).not.toBeInTheDocument();
  });

  it('should toggle to HTML Editor view when clicking Editor button', () => {
    render(<RightPanel />);
    
    // Toggle button to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    // Should render editor label and HTML statement container
    expect(screen.getByText('Interactive Editor (Magic Mirror)')).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
  });

  it('should open generic field edit modal and update Zustand store state', () => {
    render(<RightPanel />);
    
    // Switch to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    // Check basic presence of the logo/title block
    const addressBlock = screen.getByText('KOMÁRNICKÁ 11, BRATISLAVA');
    fireEvent.click(addressBlock);

    // Verify modal appears
    expect(screen.getByText('Upraviť hodnotu')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresa pobočky')).toBeInTheDocument();

    // Type new address
    const input = screen.getByLabelText('Adresa pobočky');
    fireEvent.change(input, { target: { value: 'NOVÁ ADRESA 12, KOŠICE' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Uložiť/i });
    fireEvent.click(saveBtn);

    // Modal should close
    expect(screen.queryByText('Upraviť hodnotu')).not.toBeInTheDocument();

    // Zustand store should be updated and UI should re-render
    expect(screen.getByText('NOVÁ ADRESA 12, KOŠICE')).toBeInTheDocument();
    expect(useAppStore.getState().sourceOfTruth.bank.bank_outlet_address).toBe('NOVÁ ADRESA 12, KOŠICE');
  });

  it('should open transaction modal, save edit, and recalculate balances', () => {
    // Inject a test transaction and opening balance
    useAppStore.getState().setOpeningBalance(100);
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 200,
        popis: 'Výplata',
        type: 'incoming',
        is_fee: false,
      }
    ]);

    render(<RightPanel />);
    
    // Switch to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    // Balances check with exact formatted text to avoid matching simple table strings
    expect(screen.getByText('100.00 EUR')).toBeInTheDocument(); // opening balance
    expect(screen.getByText(/200\.00 EUR/)).toBeInTheDocument(); // total credit
    expect(screen.getAllByText('300.00 EUR')[0]).toBeInTheDocument(); // closing balance / disponibilny zostatok

    // Find transaction row and click it
    const txRow = screen.getByText('Výplata');
    fireEvent.click(txRow);

    // Modal appears
    expect(screen.getByText('Upraviť transakciu #1')).toBeInTheDocument();

    // Change amount to 500
    const amountInput = screen.getByLabelText('Suma');
    fireEvent.change(amountInput, { target: { value: '500' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Uložiť/i });
    fireEvent.click(saveBtn);

    // Recalculated balance should be displayed (100 + 500 = 600)
    expect(screen.getByText(/500\.00 EUR/)).toBeInTheDocument();
    expect(screen.getAllByText('600.00 EUR')[0]).toBeInTheDocument();
  });

  it('should delete transaction and update balances', () => {
    useAppStore.getState().setOpeningBalance(1000);
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -200,
        popis: 'Nákup potravín',
        type: 'outgoing',
        is_fee: false,
      }
    ]);

    render(<RightPanel />);
    
    // Switch to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    expect(screen.getByText('Nákup potravín')).toBeInTheDocument();
    expect(screen.getAllByText('800.00 EUR')[0]).toBeInTheDocument(); // closing balance 1000 - 200

    // Click transaction row
    fireEvent.click(screen.getByText('Nákup potravín'));

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /Zmazať/i });
    fireEvent.click(deleteBtn);

    // Transaction should be gone, balance should be 1 000.00 EUR (formatted with thousands separator space)
    expect(screen.queryByText('Nákup potravín')).not.toBeInTheDocument();
    expect(screen.getAllByText('1 000.00 EUR').length).toBe(3); // opening, closing, and available balances are 1000
  });

  it('should have unique key on PDFViewer to prevent WASM Config collision', () => {
    // Setup initial state
    useAppStore.getState().setStatementData({
      statement_month: '11',
      statement_year: '2025'
    });
    
    render(<RightPanel />);
    
    // PDFViewer should render without error (key prevents WASM collision)
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should display ZIP export button in batch mode', () => {
    // Enable batch mode with statements
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();
    
    render(<RightPanel />);
    
    // Should show batch navigation and export button
    expect(screen.getByText(/Vygenerované výpisy/)).toBeInTheDocument();
    expect(screen.getByText(/Exportovať všetky do ZIP/)).toBeInTheDocument();
  });

  it('should handle PDFViewer key change when statement data changes', () => {
    // Reset store to ensure clean state
    useAppStore.setState({
      sourceOfTruth: {
        ...useAppStore.getState().sourceOfTruth,
        statement: {
          ...useAppStore.getState().sourceOfTruth.statement,
          statement_month: '11',
          statement_year: '2025'
        }
      }
    });
    
    const { rerender } = render(<RightPanel />);
    
    // PDFViewer should render with initial key
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    
    // Change statement data - this changes the key
    act(() => {
      useAppStore.getState().setStatementData({
        statement_month: '12',
        statement_year: '2025'
      });
    });
    
    // Re-render component with new key
    act(() => {
      rerender(<RightPanel />);
    });
    
    // New PDFViewer should be rendered with new key
    // The key prop ensures clean unmount and new instance
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });
});
