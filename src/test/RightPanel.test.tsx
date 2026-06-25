import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
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

    // Find the Logo Banky editable field and click it
    const logoField = screen.getByText('VÚB BANKA Intesa Sanpaolo Group');
    fireEvent.click(logoField);

    // Verify modal appears
    expect(screen.getByText('Upraviť hodnotu')).toBeInTheDocument();
    expect(screen.getByLabelText('Logo banky')).toBeInTheDocument();

    // Type new logo
    const input = screen.getByLabelText('Logo banky');
    fireEvent.change(input, { target: { value: 'TATRA BANKA' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Uložiť/i });
    fireEvent.click(saveBtn);

    // Modal should close
    expect(screen.queryByText('Upraviť hodnotu')).not.toBeInTheDocument();

    // Zustand store should be updated and UI should re-render
    expect(screen.getByText('TATRA BANKA')).toBeInTheDocument();
    expect(useAppStore.getState().sourceOfTruth.bank.bank_logo_id).toBe('TATRA BANKA');
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
      }
    ]);

    render(<RightPanel />);
    
    // Switch to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    // Balances check with exact formatted text to avoid matching simple table strings
    expect(screen.getByText('100.00 EUR')).toBeInTheDocument(); // opening balance
    expect(screen.getByText('+200.00 EUR')).toBeInTheDocument(); // total credit
    expect(screen.getByText('300.00 EUR')).toBeInTheDocument(); // closing balance

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
    expect(screen.getByText('+500.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('600.00 EUR')).toBeInTheDocument();
  });

  it('should delete transaction and update balances', () => {
    useAppStore.getState().setOpeningBalance(1000);
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -200,
        popis: 'Nákup potravín',
      }
    ]);

    render(<RightPanel />);
    
    // Switch to Editor
    const editorBtn = screen.getByRole('button', { name: /Editor \(HTML\)/i });
    fireEvent.click(editorBtn);

    expect(screen.getByText('Nákup potravín')).toBeInTheDocument();
    expect(screen.getByText('800.00 EUR')).toBeInTheDocument(); // closing balance 1000 - 200

    // Click transaction row
    fireEvent.click(screen.getByText('Nákup potravín'));

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /Zmazať/i });
    fireEvent.click(deleteBtn);

    // Transaction should be gone, balance should be 1 000.00 EUR (formatted with thousands separator space)
    expect(screen.queryByText('Nákup potravín')).not.toBeInTheDocument();
    expect(screen.getAllByText('1 000.00 EUR').length).toBe(2); // both opening & closing balances are 1000
  });
});
