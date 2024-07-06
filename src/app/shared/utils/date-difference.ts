export function dateDifference(
  date1: Date,
  date2: Date,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'days',
): number {
  const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime());

  switch (unit) {
    case 'milliseconds':
      return diffInMilliseconds;
    case 'seconds':
      return diffInMilliseconds / 1000;
    case 'minutes':
      return diffInMilliseconds / (1000 * 60);
    case 'hours':
      return diffInMilliseconds / (1000 * 60 * 60);
    case 'days':
      return diffInMilliseconds / (1000 * 60 * 60 * 24);
  }
}
