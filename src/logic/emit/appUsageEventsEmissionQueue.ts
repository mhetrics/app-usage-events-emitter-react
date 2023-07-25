import { createQueueWithBatchConsumer } from 'simple-in-memory-queue';
import { pick } from 'type-fns';

import { AppUsageEvent, AppUsageEventSource } from '../../domain/AppUsageEvent';
import { queueTaskEmitToRemote } from './asyncTask/queueTaskEmitToRemote';
import { base64EncodeCompressedPayload } from './compression/base64EncodeCompressedPayload';
import { serializeAndCompressPayload } from './compression/serializeAndCompressPayload';

/**
 * define a standard first arg for console.logs emitted from our monitoring
 *
 * why?
 * - enables preventing infinite loop, since we also capture console.log events
 * - i.e., we can filter out the console.logs that have this prefix and not capture them
 */
export const APP_USAGE_EVENTS_EMISSION_LOG_FIRST_ARG = 'AUE';

// create the queue w/ a batch consumer
export const appUsageEventsEmissionQueue =
  createQueueWithBatchConsumer<AppUsageEvent>({
    threshold: { milliseconds: 1000, size: 100 },
    consumer: async ({ items: events }) => {
      await queueTaskEmitToRemote({
        endpoint: '/capture/events',
        payload: base64EncodeCompressedPayload(
          serializeAndCompressPayload(events),
        ),
      });
    },
  });

const isNoisySource = (source: AppUsageEventSource) =>
  [
    // skip logging noisy event sources
    AppUsageEventSource.NETWORK,
    AppUsageEventSource.ACTIVITY,
  ].includes(source);

// also, log out when events are added
appUsageEventsEmissionQueue.on.push.subscribe({
  consumer: ({ event: { items } }) =>
    (window as any)?.aue?.log === true && !isNoisySource(items[0]?.source)
      ? console.log(
          APP_USAGE_EVENTS_EMISSION_LOG_FIRST_ARG,
          JSON.stringify(pick(items[0]!, ['source', 'type', 'details'])),
        )
      : null,
});
