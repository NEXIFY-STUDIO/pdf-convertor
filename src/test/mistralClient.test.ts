import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseStatementWithAI, preprocessVUBText, normalizeAIResult } from '../lib/mistralClient';

describe('parseStatementWithAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if API key is missing', async () => {
    await expect(parseStatementWithAI('some statement text', '')).rejects.toThrow(
      'Chýba Mistral API kľúč. Zadajte ho prosím v nastaveniach.'
    );
  });

  it('should call fetch with correct URL, headers and body', async () => {
    const mockResponseData = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              client: { client_title: 'Test Client' },
              statement: { statement_number: '12/2025' },
              balances: { opening_balance: 1500 },
              transactions: []
            })
          }
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponseData)
    });
    global.fetch = mockFetch;

    const result = await parseStatementWithAI('statement text', 'mock-api-key', 'open-mistral-nemo');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer mock-api-key'
        },
        body: expect.any(String)
      })
    );

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('open-mistral-nemo');
    expect(requestBody.temperature).toBe(0.1);

    expect(result.client?.client_title).toBe('Test Client');
    expect(result.statement?.statement_number).toBe('12/2025');
    expect(result.balances?.opening_balance).toBe(1500);
  });

  it('should throw an error if the API response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ message: 'Invalid API Key' })
    });
    global.fetch = mockFetch;

    await expect(
      parseStatementWithAI('statement text', 'mock-api-key')
    ).rejects.toThrow('Chyba API Mistral: Invalid API Key');
  });

  it('should handle API response errors with no message field gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('JSON parse failed'))
    });
    global.fetch = mockFetch;

    await expect(
      parseStatementWithAI('statement text', 'mock-api-key')
    ).rejects.toThrow('Chyba API Mistral: HTTP error 500');
  });

  it('should throw an error if choices array is missing or empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] })
    });
    global.fetch = mockFetch;

    await expect(
      parseStatementWithAI('statement text', 'mock-api-key')
    ).rejects.toThrow('Mistral API nevrátilo žiadny obsah.');
  });
});

describe('normalizeAIResult v2 transaction fields', () => {
  it('should preserve details, bank_ref and fee_type on transactions', () => {
    const result = normalizeAIResult({
      transactions: [
        {
          description: 'ZSE ENERGIA',
          details: ['SK11 0200', 'Názov: energia'],
          bank_ref: 'REF-001',
          fee_type: 'L',
          date_valuta: '01.07.2022',
          amount: -92,
        },
      ],
    });

    expect(result.transactions[0].popis).toBe('ZSE ENERGIA');
    expect(result.transactions[0].details).toEqual(['SK11 0200', 'Názov: energia']);
    expect(result.transactions[0].bank_ref).toBe('REF-001');
    expect(result.transactions[0].fee_type).toBe('L');
  });

  it('should filter empty strings from details array', () => {
    const result = normalizeAIResult({
      transactions: [{ description: 'Test', details: ['ok', '', '  '] }],
    });
    expect(result.transactions[0].details).toEqual(['ok']);
  });
});

describe('preprocessVUBText', () => {
  it('should strip system header lines matching VUB_AFP...', () => {
    const raw = 'Some text\nVUB_AFP_RETAELE_XDA_20220729111224_120XP.DAT.xml 3763129 PIDS253D\nOther text';
    const processed = preprocessVUBText(raw);
    expect(processed).toContain('Some text');
    expect(processed).toContain('Other text');
    expect(processed).not.toContain('VUB_AFP');
  });

  it('should merge lines ending with colons or slashes with the following line', () => {
    const raw = 'Účel platby: /\nSP\nAnother line ending:\nwith value';
    const processed = preprocessVUBText(raw);
    expect(processed).toContain('Účel platby: / SP');
    expect(processed).toContain('Another line ending: with value');
  });

  it('should extract the year from statement number header and append it to short dates', () => {
    const raw = 'Por. číslo: 7/2022\n01/07 some txn\n04.07 other txn\n31.07.2022 existing date';
    const processed = preprocessVUBText(raw);
    expect(processed).toContain('01.07.2022 some txn');
    expect(processed).toContain('04.07.2022 other txn');
    // Ensure it doesn't duplicate the year if it was already present
    expect(processed).toContain('31.07.2022 existing date');
    expect(processed).not.toContain('.2022.2022');
  });
});
