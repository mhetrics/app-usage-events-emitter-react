import { createCache } from 'simple-in-memory-cache';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageApplication } from '../../domain/AppUsageApplication';

// track the application in memory
let application: AppUsageApplication | null = null;

export const setApplicationOfSession = (set: AppUsageApplication) =>
  (application = set);

export const getApplicationOfSession = (): AppUsageApplication => {
  if (!application) throw new Error('application not set yet');
  return application;
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const waitForApplicationOfSession = withSimpleCaching(
  async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (application) return application;
      await sleep(300);
    }
    throw new Error('application wait attempts exceeded');
  },
  { cache: createCache() }, // cache the promise in memory, so we only ever create one promise for this no matter how many duplicate requests
);
