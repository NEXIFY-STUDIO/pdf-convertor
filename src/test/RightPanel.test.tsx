import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, act, within, waitFor } from '@testing-library/react';
import RightPanel from '../components/RightPanel';
import { useAppStore } from '../store/useAppStore';

const mockDownloadZip = vi.fn().mockResolvedValue(undefined);
const mockCheckMemory = vi.fn().mockReturnValue(true);

vi.mock('../export/zipExport', () => ({
  checkMemoryBeforeExport: (...args: unknown[]) => mockCheckMemory(...args),
  downloadStatementsZip: (...args: unknown[]) => mockDownloadZip(...args),
}));

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

describe('RightPanel PDF Preview & Inspector', () => {
  it('should default to PDF preview mode', () => {
    render(<RightPanel />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    expect(screen.getByText('Live PDF Preview')).toBeInTheDocument();
  });

  it('should open Inspector panel when clicking Inspector button', () => {
    render(<RightPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));

    expect(screen.getByRole('button', { name: /Počiatočný zostatok/i })).toBeInTheDocument();
    expect(screen.getByText(/Transakcie \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should edit field via Inspector and update Zustand store', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));

    fireEvent.click(screen.getByText('Adresa pobočky'));

    const input = screen.getByLabelText('Adresa pobočky');
    fireEvent.change(input, { target: { value: 'NOVÁ ADRESA 12, KOŠICE' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));

    expect(useAppStore.getState().sourceOfTruth.bank.bank_outlet_address).toBe('NOVÁ ADRESA 12, KOŠICE');
  });

  it('should edit transaction via Inspector and recalculate balances', () => {
    useAppStore.getState().setOpeningBalance(100);
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 200,
        popis: 'Výplata',
        type: 'incoming',
        is_fee: false,
      },
    ]);

    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));

    expect(screen.getByText('200.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('300.00 EUR')).toBeInTheDocument();

    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Výplata'));

    const amountInput = screen.getByLabelText('Suma');
    fireEvent.change(amountInput, { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));

    expect(screen.getByText('500.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('600.00 EUR')).toBeInTheDocument();
  });

  it('should delete transaction via Inspector and update balances', () => {
    useAppStore.getState().setOpeningBalance(1000);
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -200,
        popis: 'Nákup potravín',
        type: 'outgoing',
        is_fee: false,
      },
    ]);

    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));

    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Nákup potravín'));
    fireEvent.click(screen.getByRole('button', { name: /Zmazať/i }));

    expect(screen.queryByText('Nákup potravín')).not.toBeInTheDocument();
    expect(screen.getAllByText('1 000.00 EUR').length).toBeGreaterThanOrEqual(2);
  });

  it('should have unique key on PDFViewer to prevent WASM Config collision', () => {
    useAppStore.getState().setStatementData({ statement_month: '11', statement_year: '2025' });
    render(<RightPanel />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should not call ZIP export when batch is empty', async () => {
    mockDownloadZip.mockClear();
    useAppStore.setState({ batchMode: true, batchStatements: [] });
    render(<RightPanel />);
    expect(screen.queryByText(/Exportovať všetky do ZIP/)).not.toBeInTheDocument();
    expect(mockDownloadZip).not.toHaveBeenCalled();
  });

  it('should display ZIP export button in batch mode', () => {
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    render(<RightPanel />);

    expect(screen.getByText(/Vygenerované výpisy/)).toBeInTheDocument();
    expect(screen.getByText(/Exportovať všetky do ZIP/)).toBeInTheDocument();
  });

  it('should toggle Inspector panel closed', () => {
    render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Inspector$/i }));
    expect(screen.getByRole('button', { name: /Skryť Inspector/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Skryť Inspector/i }));
    expect(screen.queryByText(/Transakcie \(\d+\)/)).not.toBeInTheDocument();
  });

  it('should apply ft-preview-split class when Inspector open', () => {
    const { container } = render(<RightPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Inspector/i }));
    expect(container.querySelector('.ft-preview-split')).toBeInTheDocument();
  });

  it('should switch batch statement via timeline chip', () => {
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();
    render(<RightPanel />);
    const chips = screen.getAllByRole('button').filter((b) => b.className.includes('ft-batch-chip'));
    expect(chips.length).toBeGreaterThan(1);
    fireEvent.click(chips[1]);
    expect(useAppStore.getState().selectedBatchIndex).toBe(1);
  });

  it('should trigger ZIP export when memory check passes', async () => {
    mockCheckMemory.mockReturnValue(true);
    mockDownloadZip.mockClear();
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    render(<RightPanel />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Exportovať všetky do ZIP/));
    });

    await waitFor(() => {
      expect(mockCheckMemory).toHaveBeenCalled();
      expect(mockDownloadZip).toHaveBeenCalled();
    });
  });

  it('should show alert when ZIP export throws', async () => {
    const alert = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('alert', alert);
    mockCheckMemory.mockReturnValue(true);
    mockDownloadZip.mockRejectedValueOnce(new Error('ZIP fail'));

    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    render(<RightPanel />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Exportovať všetky do ZIP/));
    });

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        expect.stringContaining('Chyba pri generovaní ZIP archívu'),
      );
    });
    consoleSpy.mockRestore();
  });

  it('should skip ZIP export when memory check fails', async () => {
    mockCheckMemory.mockReturnValue(false);
    mockDownloadZip.mockClear();
    useAppStore.getState().setBatchMode(true);
    useAppStore.getState().generateBatch();

    render(<RightPanel />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Exportovať všetky do ZIP/));
    });

    await waitFor(() => {
      expect(mockCheckMemory).toHaveBeenCalled();
    });
    expect(mockDownloadZip).not.toHaveBeenCalled();
  });

  it('should handle PDFViewer key change when statement data changes', () => {
    useAppStore.setState({
      sourceOfTruth: {
        ...useAppStore.getState().sourceOfTruth,
        statement: {
          ...useAppStore.getState().sourceOfTruth.statement,
          statement_month: '11',
          statement_year: '2025',
        },
      },
    });

    const { rerender } = render(<RightPanel />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

    act(() => {
      useAppStore.getState().setStatementData({ statement_month: '12', statement_year: '2025' });
    });

    act(() => {
      rerender(<RightPanel />);
    });

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });
});