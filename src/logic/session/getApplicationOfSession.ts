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
export const waitForApplicationOfSession = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (application) return application;
    await sleep(300);
  }
  throw new Error('application wait attempts exceeded');
};
