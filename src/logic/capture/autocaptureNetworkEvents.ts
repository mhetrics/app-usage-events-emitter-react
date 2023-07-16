import { createCache } from 'simple-in-memory-cache';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageEventSource } from '../../domain/AppUsageEvent';
import { captureAppUsageEvent } from './captureAppUsageEvent';

/**
 * used to prevent infinite loop of logging on our own requests
 */
const APP_USAGE_EVENTS_EXPECTED_HOST_PREFIX = 'https://aue.';
const POLLING_NETWORK_REQUEST_HOST_PREFIXES = [
  'https://app.posthog.com/',
  'https://r.lr-ingest.io/',
];

/**
 * listen to and automatically capture network events
 *
 * note
 * - "with simple caching" to prevent duplicate mounting
 */
export const autocaptureNetworkEvents = withSimpleCaching(
  () => {
    /**
     * network state has changed
     *
     * note
     * - online may have false positives, as it only checks that there is a network connection and not that the network is connected to the internet
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event
     */
    window.addEventListener('offline', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.NETWORK,
        type: 'network.offline',
        details: null,
      }),
    );
    window.addEventListener('online', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.NETWORK,
        type: 'network.online',
        details: null,
      }),
    );

    /**
     * network request events
     *
     * note
     * - enables tracking duration of network requests
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing
     */
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (
          entry.duration &&
          !entry.name.includes(APP_USAGE_EVENTS_EXPECTED_HOST_PREFIX) &&
          // filter out the hosts that regularly poll // TODO: automatically detect these
          !POLLING_NETWORK_REQUEST_HOST_PREFIXES.some((hostPrefix) =>
            entry.name.includes(hostPrefix),
          )
        )
          void captureAppUsageEvent({
            source: AppUsageEventSource.NETWORK,
            type: 'network.request',
            details: {
              resource: entry.name,
              milliseconds: Math.round(entry.duration),
              bytes: {
                transferred: entry.toJSON().transferSize, // may be 0 if it was cached
                encoded: entry.toJSON().encodedBodySize,
                decoded: entry.toJSON().decodedBodySize,
              },
              effect: entry.toJSON().renderBlockingStatus,
            },
          });
      });
    });
    observer.observe({ type: 'resource', buffered: true });
  },
  { cache: createCache() },
);
