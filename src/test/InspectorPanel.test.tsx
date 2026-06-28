import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, within } from '@testing-library/react';
import InspectorPanel from '../editor/InspectorPanel';
import { useAppStore } from '../store/useAppStore';

describe('InspectorPanel', () => {
  beforeEach(() => {
    useAppStore.getState().setOpeningBalance(1000);
    useAppStore.getState().setTransactions([]);
    useAppStore.getState().setBankData({
      bank_logo_id: 'VÚB BANKA Intesa Sanpaolo Group',
      bank_register_info: 'VÚB, a.s.',
      bank_outlet_id: '30017',
      bank_outlet_address: 'KOMÁRNICKÁ 11, BRATISLAVA',
      bank_logo_image: undefined,
    });
    useAppStore.setState((state) => ({
      sourceOfTruth: {
        ...state.sourceOfTruth,
        balances: {
          opening_balance: 1000,
          closing_balance: 1200,
          total_credit: 500,
          total_debit: 300,
          total_fees: 0,
        },
      },
    }));
  });

  it('should show Bez popisu for transaction without popis', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 5,
        type: 'incoming',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    expect(screen.getByText('Bez popisu')).toBeInTheDocument();
  });

  it('should use EUR default currency in summary', () => {
    useAppStore.getState().setStatementData({ statement_currency: undefined });
    render(<InspectorPanel />);
    expect(screen.getAllByText(/EUR/).length).toBeGreaterThan(0);
  });

  it('should render balance summary with formatted currency', () => {
    render(<InspectorPanel />);
    expect(screen.getByText('1 000.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('500.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('300.00 EUR')).toBeInTheDocument();
    expect(screen.getByText('1 200.00 EUR')).toBeInTheDocument();
  });

  it('should render all blueprint field groups', () => {
    render(<InspectorPanel />);
    expect(screen.getByText('Banka')).toBeInTheDocument();
    expect(screen.getByText('Klient')).toBeInTheDocument();
    expect(screen.getByText('Výpis')).toBeInTheDocument();
    expect(screen.getByText('Logo banky (text)')).toBeInTheDocument();
    expect(screen.getByText('IBAN')).toBeInTheDocument();
    expect(screen.getByText('Poradové číslo')).toBeInTheDocument();
  });

  it('should show logo upload when no image set', () => {
    render(<InspectorPanel />);
    expect(screen.getByText(/Nahrať logo/)).toBeInTheDocument();
  });

  it('should show remove logo button when image exists', () => {
    useAppStore.getState().setBankData({ bank_logo_image: 'data:image/png;base64,abc' });
    render(<InspectorPanel />);
    expect(screen.getByAltText('Bank Logo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Odstrániť logo'));
    expect(useAppStore.getState().sourceOfTruth.bank.bank_logo_image).toBeUndefined();
  });

  it('should edit bank field via multiline textarea', () => {
    render(<InspectorPanel />);
    fireEvent.click(screen.getByText('Registračné info'));
    const textarea = screen.getByLabelText('Registračné info');
    expect(textarea.tagName).toBe('TEXTAREA');
    fireEvent.change(textarea, { target: { value: 'Nové registračné údaje' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));
    expect(useAppStore.getState().sourceOfTruth.bank.bank_register_info).toBe('Nové registračné údaje');
  });

  it('should edit client field', () => {
    render(<InspectorPanel />);
    fireEvent.click(screen.getByText('Názov / Meno'));
    fireEvent.change(screen.getByLabelText('Názov / Meno'), { target: { value: 'NOVÁ FIRMA s.r.o.' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));
    expect(useAppStore.getState().sourceOfTruth.client.client_title).toBe('NOVÁ FIRMA s.r.o.');
  });

  it('should edit opening balance via summary button', () => {
    render(<InspectorPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Počiatočný zostatok/i }));
    const input = screen.getByLabelText('Počiatočný zostatok') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2500.5' } });
    const editor = document.querySelector('.ft-inspector-editor')!;
    fireEvent.click(within(editor as HTMLElement).getByRole('button', { name: 'Uložiť' }));
    expect(useAppStore.getState().sourceOfTruth.balances.opening_balance).toBe(2500.5);
  });

  it('should edit statement_date without clearing month/year', () => {
    useAppStore.getState().setStatementData({ statement_month: '11', statement_year: '2025' });
    render(<InspectorPanel />);
    fireEvent.click(screen.getByText('Dátum vyhotovenia'));
    fireEvent.change(screen.getByLabelText('Dátum vyhotovenia'), { target: { value: '15.11.2025' } });
    fireEvent.click(screen.getByRole('button', { name: 'Uložiť' }));
    const stmt = useAppStore.getState().sourceOfTruth.statement;
    expect(stmt.statement_date).toBe('15.11.2025');
    expect(stmt.statement_month).toBe('11');
    expect(stmt.statement_year).toBe('2025');
  });

  it('should clear statement_month/year when custom statement_number saved', () => {
    useAppStore.getState().setStatementData({ statement_month: '11', statement_year: '2025' });
    render(<InspectorPanel />);
    fireEvent.click(screen.getByText('Poradové číslo'));
    fireEvent.change(screen.getByLabelText('Poradové číslo'), { target: { value: 'CUSTOM-99' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));
    const stmt = useAppStore.getState().sourceOfTruth.statement;
    expect(stmt.statement_number).toBe('CUSTOM-99');
    expect(stmt.statement_month).toBe('');
    expect(stmt.statement_year).toBe('');
  });

  it('should cancel field edit without saving', () => {
    const before = useAppStore.getState().sourceOfTruth.client.client_city;
    render(<InspectorPanel />);
    fireEvent.click(screen.getByText('Mesto'));
    fireEvent.change(screen.getByLabelText('Mesto'), { target: { value: 'Košice' } });
    fireEvent.click(screen.getByRole('button', { name: /Zrušiť/i }));
    expect(useAppStore.getState().sourceOfTruth.client.client_city).toBe(before);
  });

  it('should edit transaction with details, bank_ref and fee_type', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -100,
        popis: 'Platba',
        type: 'outgoing',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);

    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Platba'));

    fireEvent.change(screen.getByLabelText('Popis (krátky)'), { target: { value: 'ZSE ENERGIA' } });
    fireEvent.change(screen.getByLabelText(/Detail riadky PDF/), {
      target: { value: 'SK11 0200 0000 0000 0000 0001\nNázov: energia' },
    });
    fireEvent.change(screen.getByLabelText('Bank. referencia'), { target: { value: 'REF-XYZ' } });
    fireEvent.change(screen.getByLabelText('Typ popl. (I/X/L)'), { target: { value: 'l' } });
    fireEvent.change(screen.getByLabelText('VS'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));

    const tx = useAppStore.getState().sourceOfTruth.transactions[0];
    expect(tx.popis).toBe('ZSE ENERGIA');
    expect(tx.details).toEqual(['SK11 0200 0000 0000 0000 0001', 'Názov: energia']);
    expect(tx.bank_ref).toBe('REF-XYZ');
    expect(tx.fee_type).toBe('L');
    expect(tx.vs).toBe('999');
  });

  it('should clear details when textarea emptied on save', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 50,
        popis: 'Test',
        details: ['riadok'],
        type: 'incoming',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Test'));
    fireEvent.change(screen.getByLabelText(/Detail riadky PDF/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));
    expect(useAppStore.getState().sourceOfTruth.transactions[0].details).toBeUndefined();
  });

  it('should default amount to 0 when invalid number on save', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 10,
        popis: 'Suma test',
        type: 'incoming',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Suma test'));
    fireEvent.change(screen.getByLabelText('Suma'), { target: { value: 'nie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Uložiť' }));
    expect(useAppStore.getState().sourceOfTruth.transactions[0].amount).toBe(0);
  });

  it('should mark transaction as fee and recalculate type', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -5,
        popis: 'Poplatok',
        type: 'outgoing',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Poplatok'));
    fireEvent.click(screen.getByLabelText('Poplatok banky'));
    fireEvent.click(screen.getByRole('button', { name: /Uložiť/i }));
    expect(useAppStore.getState().sourceOfTruth.transactions[0].is_fee).toBe(true);
    expect(useAppStore.getState().sourceOfTruth.transactions[0].type).toBe('fee');
  });

  it('should delete transaction', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: -10,
        popis: 'Zmazať ma',
        type: 'outgoing',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Zmazať ma'));
    fireEvent.click(screen.getByRole('button', { name: 'Zmazať' }));
    expect(useAppStore.getState().sourceOfTruth.transactions).toHaveLength(0);
  });

  it('should cancel transaction edit', () => {
    useAppStore.getState().setTransactions([
      {
        date_realiz: '01.01.2025',
        date_valuta: '01.01.2025',
        amount: 10,
        popis: 'Pôvodný',
        type: 'incoming',
        is_fee: false,
      },
    ]);
    render(<InspectorPanel />);
    const txList = document.querySelector('.ft-inspector-tx-list')!;
    fireEvent.click(within(txList as HTMLElement).getByText('Pôvodný'));
    fireEvent.change(screen.getByLabelText('Popis (krátky)'), { target: { value: 'Zmenený' } });
    fireEvent.click(screen.getByRole('button', { name: /Zrušiť/i }));
    expect(useAppStore.getState().sourceOfTruth.transactions[0].popis).toBe('Pôvodný');
  });

  it('should ignore file input when no file selected', () => {
    render(<InspectorPanel />);
    const input = document.querySelector('.ft-inspector-upload input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(useAppStore.getState().sourceOfTruth.bank.bank_logo_image).toBeUndefined();
  });

  it('should set opening balance to 0 for invalid number input', () => {
    render(<InspectorPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Počiatočný zostatok/i }));
    fireEvent.change(screen.getByLabelText('Počiatočný zostatok'), { target: { value: 'nie-číslo' } });
    const editor = document.querySelector('.ft-inspector-editor')!;
    fireEvent.click(within(editor as HTMLElement).getByRole('button', { name: 'Uložiť' }));
    expect(useAppStore.getState().sourceOfTruth.balances.opening_balance).toBe(0);
  });

  it('should upload logo via file input', async () => {
    const readAsDataURL = vi.fn();
    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null;
      readAsDataURL() {
        readAsDataURL();
        this.onload?.({ target: { result: 'data:image/png;base64,LOGO' } });
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    render(<InspectorPanel />);
    const input = document.querySelector('.ft-inspector-upload input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(readAsDataURL).toHaveBeenCalled();
    expect(useAppStore.getState().sourceOfTruth.bank.bank_logo_image).toBe('data:image/png;base64,LOGO');
  });
});