import { createQueueWithResilientRemoteConsumer } from 'simple-in-memory-queue';

import { AppUsageEvent, AppUsageEventSource } from '../../domain/AppUsageEvent';
import { captureAppUsageEvent } from './captureAppUsageEvent';

const observationCaptureQueue = createQueueWithResilientRemoteConsumer<{
  type: string;
  details: AppUsageEvent['details'];
}>({
  consumer: async ({ item }) => {
    await captureAppUsageEvent({
      source: AppUsageEventSource.OBSERVATION,
      type: item.type,
      details: item.details,
    });
  },
  threshold: {
    concurrency: 1,
    retry: 5,
    pause: 10,
  },
  delay: {
    retry: 300,
  },
});

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
  await observationCaptureQueue.push({ type, details });
};
