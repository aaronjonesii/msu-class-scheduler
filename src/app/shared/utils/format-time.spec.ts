import { formatTime, formatTimeRange } from './format-time';

describe('formatTime', () => {
  it('should read a morning time', () => {
    expect(formatTime('09:10')).toBe('9:10 AM');
  });

  it('should read an afternoon time', () => {
    expect(formatTime('13:50')).toBe('1:50 PM');
  });

  it('should read noon as PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('should read the hour after midnight as 12 AM', () => {
    expect(formatTime('00:05')).toBe('12:05 AM');
  });
});

describe('formatTimeRange', () => {
  it('should join the start and end', () => {
    expect(formatTimeRange({ startTime: '11:30', endTime: '14:20' })).toBe('11:30 AM - 2:20 PM');
  });
});
