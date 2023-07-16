import { AppUsageApplication } from '../../domain/AppUsageApplication';

// track the application in memory
let application: AppUsageApplication | null = null;

export const setApplicationOfSession = (set: AppUsageApplication) =>
  (application = set);

export const getApplicationOfSession = (): AppUsageApplication => {
  if (!application) throw new Error('application not set yet');
  return application;
};
