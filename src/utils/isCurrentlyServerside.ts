export const isCurrentlyServerSide = (): boolean =>
  typeof window === 'undefined';
