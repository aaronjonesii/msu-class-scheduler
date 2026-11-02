export function formatCredits(credits?: number | null): string {
  const count = credits ?? 0;

  return `${count} ${count === 1 ? 'credit' : 'credits'}`;
}
