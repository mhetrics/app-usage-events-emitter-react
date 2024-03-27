import { createCache } from 'simple-in-memory-cache';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageEventSource } from '../../domain/AppUsageEvent';
import { captureAppUsageEvent } from './captureAppUsageEvent';

/**
 * listen to and automatically capture device events
 *
 * note
 * - "with simple caching" to prevent duplicate mounting
 */
export const autocaptureDeviceEvents = withSimpleCaching(
  () => {
    // TODO: re-enable once we find a good way to debounce this input (and probably a usecase for it first)
    // // device motion events; https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event
    // window.addEventListener('devicemotion', (event) =>
    //   event.acceleration?.x || event.acceleration?.y || event.acceleration?.z
    //     ? captureAppUsageEvent({
    //         source: AppUsageEventSource.DEVICE,
    //         type: 'device.motion',
    //         details: {
    //           acceleration: event.acceleration,
    //           accelerationIncludingGravity: event.accelerationIncludingGravity,
    //         } as never,
    //       })
    //     : null,
    // );
    // TODO: re-enable once we find a good way to debounce this input (and probably a usecase for it first)
    // // device compass events; https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
    // addEventListener('deviceorientation', (event) =>
    //   event.alpha || event.beta || event.gamma
    //     ? captureAppUsageEvent({
    //         source: AppUsageEventSource.DEVICE,
    //         type: 'device.orientation',
    //         details: {
    //           alpha: event.alpha,
    //           beta: event.beta,
    //           gamma: event.gamma,
    //         } as never,
    //       })
    //     : null,
    // );
  },
  { cache: createCache() },
);
