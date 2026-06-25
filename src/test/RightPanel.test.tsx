import { describe, it, expect } from 'vitest';
import RightPanel from '../components/RightPanel';

describe('RightPanel Component', () => {
  it('should instantiate RightPanel component correctly', () => {
    const element = <RightPanel />;
    expect(element).toBeDefined();
    expect(element.type).toBeTypeOf('function');
  });
});
