import { AppUsageEvent, AppUsageEventSource } from '../../domain/AppUsageEvent';
import { waitForApplicationOfSession } from '../session/getApplicationOfSession';
import { captureAppUsageEvent } from './captureAppUsageEvent';

/**
 * enables programmatically capturing an observation that will be emitted as an app usage event
 *
 * usecases
 * - observe that a user has been given a particular experimental treatment
 * - observe that a user has been assigned some identifier from another analytics software
 * - etc
 *
 * note
 * - queues the requests so that even if session has not been defined yet, it will eventually succeed
 */
export const captureObservationEvent = async ({
  type,
  details,
}: {
  type: string;
  details: AppUsageEvent['details'];
}) => {
  if (typeof window === 'undefined') return; // do nothing on serverside, since no installation-uuid available
  await waitForApplicationOfSession();
  await captureAppUsageEvent({
    source: AppUsageEventSource.OBSERVATION,
    type,
    details,
  });
};
