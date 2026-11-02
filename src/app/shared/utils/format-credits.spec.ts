import { formatCredits } from './format-credits';

describe('formatCredits', () => {
  it('should count several credits', () => {
    expect(formatCredits(4)).toBe('4 credits');
  });

  it('should say credit for one', () => {
    expect(formatCredits(1)).toBe('1 credit');
  });

  it('should show 0 when there are none', () => {
    expect(formatCredits(null)).toBe('0 credits');
    expect(formatCredits(undefined)).toBe('0 credits');
  });
});
