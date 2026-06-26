import { describe, it, expect } from 'vitest';
import { FIELD_BLUEPRINT } from '../editor/fieldBlueprint';

describe('fieldBlueprint', () => {
  it('should define all required editor groups', () => {
    const groups = FIELD_BLUEPRINT.map((g) => g.group);
    expect(groups).toEqual(['Banka', 'Klient', 'Výpis']);
  });

  it('should have unique field keys per section', () => {
    const keys = FIELD_BLUEPRINT.flatMap((g) =>
      g.fields.map((f) => `${f.section}.${f.key}`),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('should mark bank_register_info as multiline', () => {
    const bankFields = FIELD_BLUEPRINT.find((g) => g.group === 'Banka')!.fields;
    const regInfo = bankFields.find((f) => f.key === 'bank_register_info');
    expect(regInfo?.multiline).toBe(true);
  });

  it('should cover all client identity fields', () => {
    const clientKeys = FIELD_BLUEPRINT
      .find((g) => g.group === 'Klient')!
      .fields.map((f) => f.key);
    expect(clientKeys).toContain('client_iban');
    expect(clientKeys).toContain('client_swift');
    expect(clientKeys).toContain('client_id');
  });

  it('should cover statement period fields', () => {
    const stmtKeys = FIELD_BLUEPRINT
      .find((g) => g.group === 'Výpis')!
      .fields.map((f) => f.key);
    expect(stmtKeys).toContain('period_start');
    expect(stmtKeys).toContain('period_end');
    expect(stmtKeys).toContain('statement_number');
  });
});