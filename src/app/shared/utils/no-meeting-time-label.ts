const ONLINE = /online/i;

/** What to show in place of a time, for a meeting that doesn't have one. */
export function noMeetingTimeLabel({ location }: { location?: string | null }): string {
  return location && ONLINE.test(location) ? location : 'To be announced';
}
