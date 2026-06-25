import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseStatementWithAI } from '../lib/mistralClient';

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
