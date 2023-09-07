export class AppUsageEventEmissionError extends Error {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(message: string, metadata: any) {
    super([message, JSON.stringify(metadata, null, 2)].join('\n'));
  }
}
