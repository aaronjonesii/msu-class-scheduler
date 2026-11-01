import { noMeetingTimeLabel } from './no-meeting-time-label';

describe('noMeetingTimeLabel', () => {
  it('should show where an online class meets', () => {
    expect(noMeetingTimeLabel({ location: 'Online Asynchronous' })).toBe('Online Asynchronous');
  });

  it('should recognize other online wording', () => {
    expect(noMeetingTimeLabel({ location: 'Online Synchronous' })).toBe('Online Synchronous');
    expect(noMeetingTimeLabel({ location: 'online' })).toBe('online');
  });

  it('should say to be announced when there is no location', () => {
    expect(noMeetingTimeLabel({ location: null })).toBe('To be announced');
    expect(noMeetingTimeLabel({})).toBe('To be announced');
  });

  it('should say to be announced for a room, which is not an alternative to a time', () => {
    expect(noMeetingTimeLabel({ location: 'Wells Hall A1' })).toBe('To be announced');
  });
});
