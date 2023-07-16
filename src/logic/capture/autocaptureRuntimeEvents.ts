import { createCache } from 'simple-in-memory-cache';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageEventSource } from '../../domain/AppUsageEvent';
import { AppUsageEventEmissionError } from '../AppUsageEventEmissionError';
import { APP_USAGE_EVENTS_EMISSION_LOG_FIRST_ARG } from '../emit/appUsageEventsEmissionQueue';
import { captureAppUsageEvent } from './captureAppUsageEvent';

/**
 * listen to and automatically capture runtime events
 *
 * note
 * - "with simple caching" to prevent duplicate mounting
 */
export const autocaptureRuntimeEvents = withSimpleCaching(
  () => {
    /**
     * script error events
     *
     * note
     * - fired on a Window object when a resource failed to load or couldn't be used — for example if a script has an execution error.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event
     */
    window.addEventListener('error', (event) =>
      captureAppUsageEvent({
        source: AppUsageEventSource.RUNTIME,
        type: 'runtime.error.resource',
        details: { errorType: event.type, errorMessage: event.message },
      }),
    );

    /**
     * fullscreen error events
     *
     * note
     * - fired when the browser cannot switch to fullscreen mode.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenerror_event
     */
    window.addEventListener('fullscreenerror', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.RUNTIME,
        type: 'runtime.error.fullscreen',
        details: null, // TODO: figure out what details we may want
      }),
    );

    /**
     * unhandled rejection events
     *
     * note
     * - fired when a rejected JavaScript Promise is handled late, i.e. when a handler is attached to the promise after its rejection had caused an unhandledrejection event.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event
     */
    window.addEventListener('unhandledrejection', (event) =>
      event.reason instanceof Error &&
      event.reason.constructor.name === AppUsageEventEmissionError.name // if its an app usage event emission error, dont capture it - as it would cause infinite loop
        ? null
        : captureAppUsageEvent({
            source: AppUsageEventSource.RUNTIME,
            type: 'runtime.rejection.unhandled',
            details:
              event.reason instanceof Error
                ? {
                    errorType: event.reason.constructor.name,
                    errorMessage: event.reason.message,
                  }
                : { reason: event.reason.toString() },
          }),
    );

    /**
     * rejection events
     *
     * note
     * - fired when a rejected JavaScript Promise is handled late, i.e. when a handler is attached to the promise after its rejection had caused an unhandledrejection event.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/rejectionhandled_event
     */
    window.addEventListener('rejectionhandled', (event) =>
      event.reason instanceof Error &&
      event.reason.constructor.name === AppUsageEventEmissionError.name // if its an app usage event emission error, dont capture it - as it would cause infinite loop
        ? null
        : captureAppUsageEvent({
            source: AppUsageEventSource.RUNTIME,
            type: 'runtime.rejection.unhandled',
            details:
              event.reason instanceof Error
                ? {
                    errorType: event.reason.constructor.name,
                    errorMessage: event.reason.message,
                  }
                : { reason: event.reason.toString() },
          }),
    );

    /**
     * console logs
     *
     * note
     * - fires whenever a console.log/warn/error/etc call is made
     * - replaces the original console log implementation with ours, which runs the original implementation and captures the events
     *
     * ref
     * - https://stackoverflow.com/questions/9216441/intercept-calls-to-console-log-in-chrome
     */
    window.console = ((oldConsole) => {
      const createInterceptedConsoleMethod = ({
        level,
      }: {
        level: 'log' | 'info' | 'warn' | 'error';
      }) => {
        return (...args: Parameters<typeof oldConsole.log>) => {
          console.log(args);

          // call the original log method
          oldConsole[level](...args);

          // stop here if this was a console log produced by our app-usage-events emission queue
          if (args[0] === APP_USAGE_EVENTS_EMISSION_LOG_FIRST_ARG) return;
          // if (args[0].toString().includes(App))

          // capture the event
          void captureAppUsageEvent({
            source: AppUsageEventSource.RUNTIME,
            type: `runtime.console.${level}`,
            details: { args },
          });
        };
      };
      return {
        ...oldConsole,
        // log: createInterceptedConsoleMethod({ level: 'log' }),
        // info: createInterceptedConsoleMethod({ level: 'info' }),
        // warn: createInterceptedConsoleMethod({ level: 'warn' }),
        // error: createInterceptedConsoleMethod({ level: 'error' }),
      };
    })(window.console);
  },
  { cache: createCache() },
);
