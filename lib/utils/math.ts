export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const sumBy = <T>(list: T[] | undefined | null, pick: (item: T) => unknown): number =>
  (list ?? []).reduce((sum, item) => sum + Number(pick(item) || 0), 0);
