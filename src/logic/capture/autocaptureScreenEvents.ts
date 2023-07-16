import { createCache } from 'simple-in-memory-cache';
import { createQueueWithDebounceConsumer } from 'simple-in-memory-queue';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageEventSource } from '../../domain/AppUsageEvent';
import { UnexpectedCodePathError } from '../../utils/errors/UnexpectedCodePathError';
import { captureAppUsageEvent } from './captureAppUsageEvent';

const screenSizeChangeEventsQueue = createQueueWithDebounceConsumer<{
  height: number;
  width: number;
}>({
  gap: { milliseconds: 300 }, // wait for atleast a 300ms gap between events before invoking consumer
  consumer: async ({ items }) => {
    await captureAppUsageEvent({
      source: AppUsageEventSource.SCREEN,
      type: 'screen.size.change',
      details: { ...items.slice(-1)[0] },
    });
  },
});

/**
 * listen to and automatically capture screen events
 *
 * captures
 * - route change events
 * - visibility change events (e.g., app blur vs app focus)
 *
 * note
 * - "screens" is a more generic word for what is calls "pages" in a web environment
 * - "with simple caching" to prevent duplicate loading in page
 */
export const autocaptureScreenEvents = withSimpleCaching(
  () => {
    /**
     * ready state changes
     *
     * note
     * - fired when the readyState attribute of a document has changed
     * - when = 'interactive', document has finished loading but sub-resources such as scripts, images, stylesheets and frames are still loading
     *   - this replaces `window.ondomcontentloaded`
     * - when = 'complete', all resources have loaded
     *   - this replaces `window.onload`
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/readystatechange_event
     */
    document.addEventListener('readystatechange', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.SCREEN,
        type: 'screen.readystate.change',
        details: { state: document.readyState },
      }),
    );

    /**
     * visibility events
     *
     * note
     * - fires with a visibilityState of visible when a user refocuses the page
     * - fires with a visibilityState of hidden when a user unfocuses the page
     *   - foe example, when a user navigates to a new page, switches tabs, closes the tab, minimizes or closes the browser, or, on mobile, switches from the browser to a different app.
     *   - transitioning to hidden is the last event that's reliably observable by the page, so developers should treat it as the likely end of the user's session (for example, for sending analytics data).
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
     */
    document.addEventListener('visibilitychange', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.SCREEN,
        type: 'screen.visibility.change',
        details: { state: document.visibilityState },
      }),
    );

    /**
     * route change events
     *
     * note
     * - fired when the the window.location.href value changes
     * - checks every time the html element has a change
     *
     * ref
     * - https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
     */
    let oldHref = document.location.href;
    const html = document.querySelector('html');
    if (!html) throw new UnexpectedCodePathError('could not find html element');
    const observer = new MutationObserver(() => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        void captureAppUsageEvent({
          source: AppUsageEventSource.SCREEN,
          type: 'screen.route.change',
          details: null, // the new route will already be on the event, so no need to add it
        });
      }
    });
    observer.observe(html, { childList: true, subtree: true });

    /**
     * screen dize events
     *
     * note
     * - fires when the document view (window) has been resized - and on initial load
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event
     */
    void captureAppUsageEvent({
      source: AppUsageEventSource.SCREEN,
      type: 'screen.size.initial',
      details: {
        height: window.innerHeight,
        width: window.innerWidth,
      },
    });
    window.addEventListener('resize', () =>
      screenSizeChangeEventsQueue.push({
        height: window.innerHeight,
        width: window.innerWidth,
      }),
    );
  },
  { cache: createCache() },
);
