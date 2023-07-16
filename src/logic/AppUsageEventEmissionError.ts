export class AppUsageEventEmissionError extends Error {
  constructor(message: string, metadata: any) {
    super([message, JSON.stringify(metadata, null, 2)].join('\n'));
  }
}
