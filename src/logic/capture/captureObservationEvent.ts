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

  // wait for the app session to be loaded
  try {
    await waitForApplicationOfSession();
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // if the error was due to not having the app session, then just warn and exit. dont pass up the error
    if (error.message.includes('application wait attempts exceeded')) {
      console.warn(
        'could not capture observation event, app.session was not instantiated. was the AppUsageEventProvider loaded?',
        { type, details },
      );
      return;
    }

    // otherwise, pass up the error since we dont know what to do with it
    throw error;
  }

  // capture the event
  await captureAppUsageEvent({
    source: AppUsageEventSource.OBSERVATION,
    type,
    details,
  });
};
