import { createCache } from 'simple-in-memory-cache';
import {
  QueueOrder,
  createQueue,
  createQueueWithDebounceConsumer,
} from 'simple-in-memory-queue';
import { pick } from 'type-fns';
import { withSimpleCaching } from 'with-simple-caching';

import { AppUsageEventSource } from '../../domain/AppUsageEvent';
import { captureAppUsageEvent } from './captureAppUsageEvent';
import { getDescriptionOfElement } from './dom/getDescriptionOfElement';

const keyboardEventsQueue = createQueueWithDebounceConsumer<{
  occurredAtMse: number;
  mode: 'down' | 'up';
  key: string;
  isComposing: boolean;
}>({
  gap: { milliseconds: 500 }, // wait for atleast a 300ms gap between events before invoking consumer
  consumer: async ({ items }) => {
    // calculate the duration
    const duration = Math.round(
      items.slice(-1)[0]!.occurredAtMse - items[0]!.occurredAtMse,
    );

    // if change, capture the event
    await captureAppUsageEvent({
      source: AppUsageEventSource.ACTIVITY,
      type: 'activity.keyboard',
      details: {
        duration,
        // !: note: we do not capture the actual keys, to protect privacy and for security... otherwise, that'd be a keylogger
        keysDown: items.filter((item) => item.mode === 'down').length,
        keysUp: items.filter((item) => item.mode === 'up').length,
      },
    });
  },
});

interface PointerPressEvent {
  occurredAtMse: number;
  pointer: { id: number; type: string };
  mode: 'up' | 'down' | 'press';
  target: ReturnType<typeof getDescriptionOfElement> | undefined;
  position: {
    x: number;
    y: number;
  };
}
const pointerPressEventsQueue =
  createQueueWithDebounceConsumer<PointerPressEvent>({
    gap: { milliseconds: 300 }, // wait for atleast a 300ms gap between events before invoking consumer
    consumer: async ({ items }) => {
      // define the sequence of events, merging up+down w/ same target+pointer as "press"
      const sequence = createQueue<PointerPressEvent>({
        order: QueueOrder.LAST_IN_FIRST_OUT,
      });
      const getMergeKey = (item: PointerPressEvent) =>
        JSON.stringify(pick(item, ['pointer', 'target']));
      for (const item of items) {
        // handle pointer down
        if (item.mode === 'down') {
          sequence.push(item);
          continue;
        }

        // handle pointer up, when it was last down on the same thing -> convert to "press"
        const lastItem = sequence.peek()[0];
        if (
          lastItem?.mode === 'down' &&
          getMergeKey(lastItem) === getMergeKey(item)
        ) {
          sequence.pop(); // drop that last "down"
          sequence.push({ ...item, mode: 'press' }); // and replace it with a "press"
          continue;
        }

        // handle pointer up, otherwise
        sequence.push(item);
      }

      // emit an event for each in sequence, post merging
      await Promise.all(
        sequence
          .pop(sequence.length)
          .reverse()
          .map((item) =>
            captureAppUsageEvent({
              source: AppUsageEventSource.ACTIVITY,
              type: `activity.pointer.${item.mode}`,
              details: {
                pointer: item.pointer,
                position: item.pointer,
                target: item.target,
              },
            }),
          ),
      );
    },
  });

const pointerMoveEventsQueue = createQueueWithDebounceConsumer<{
  occurredAtMse: number;
  pointer: { id: number; type: string };
  position: {
    x: number;
    y: number;
  };
}>({
  gap: { milliseconds: 300 }, // wait for atleast a 300ms gap between events before invoking consumer
  consumer: async ({ items }) => {
    const eventsPerPointer = items.reduce((summary, item) => {
      const key = JSON.stringify(item.pointer);
      const current = summary[key] ?? [];
      return { ...summary, [key]: [...current, item] };
    }, {} as Record<string, typeof items>);
    // TODO: send separate events for changes in direction in motion (i.e., one event for moving down, another for suddenly changing back to up?)
    await Promise.all(
      Object.values(eventsPerPointer).map((theseItems) => {
        // calculate the duration
        const duration = Math.round(
          theseItems.slice(-1)[0]!.occurredAtMse - theseItems[0]!.occurredAtMse,
        );

        // calculate the difference in position
        const start = theseItems[0]!.position;
        const end = theseItems.slice(-1)[0]!.position;
        const change = { x: end.x - start.x, y: end.y - start.y };

        // if no change, no event
        if (!change.x && !change.y) return null;

        // if change, capture the event
        return captureAppUsageEvent({
          source: AppUsageEventSource.ACTIVITY,
          type: 'activity.pointer.move',
          details: {
            pointer: theseItems[0]!.pointer,
            duration,
            position: {
              start,
              end,
              change,
            },
          },
        });
      }),
    );
  },
});

const scrollEventsQueue = createQueueWithDebounceConsumer<{
  occurredAtMse: number;
  position: {
    x: number;
    y: number;
  };
}>({
  gap: { milliseconds: 300 }, // wait for atleast a 300ms gap between events before invoking consumer
  consumer: async ({ items }) => {
    // calculate the duration
    const duration = Math.round(
      items.slice(-1)[0]!.occurredAtMse - items[0]!.occurredAtMse,
    );

    // calculate the difference in position
    const start = items[0]!.position;
    const end = items.slice(-1)[0]!.position;
    const change = { x: end.x - start.x, y: end.y - start.y };

    // if no change, no event
    if (!change.x && !change.y) return;

    // if change, capture the event
    await captureAppUsageEvent({
      source: AppUsageEventSource.ACTIVITY,
      type: 'activity.scroll',
      details: {
        duration,
        position: {
          start,
          end,
          change,
        },
      },
    });
  },
});

const selectionEventsQueue = createQueueWithDebounceConsumer<{
  occurredAtMse: number;
  selection: string | null;
}>({
  gap: { milliseconds: 300 }, // wait for atleast a 300ms gap between events before invoking consumer
  consumer: async ({ items }) => {
    // calculate the duration
    const duration = Math.round(
      items.slice(-1)[0]!.occurredAtMse - items[0]!.occurredAtMse,
    );

    // if change, capture the event
    await captureAppUsageEvent({
      source: AppUsageEventSource.ACTIVITY,
      type: 'activity.selection.change',
      details: {
        duration,
        selection: items.slice(-1)[0]!.selection, // only report final selection
      },
    });
  },
});

/**
 * listen to and automatically capture network events
 *
 * note
 * - "with simple caching" to prevent duplicate mounting
 */
export const autocaptureActivityEvents = withSimpleCaching(
  () => {
    /**
     * keyboard events
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
     */
    window.addEventListener('keydown', (event) =>
      keyboardEventsQueue.push({
        occurredAtMse: event.timeStamp,
        mode: 'down',
        key: event.key,
        isComposing: event.isComposing,
      }),
    );
    window.addEventListener('keyup', (event) =>
      keyboardEventsQueue.push({
        occurredAtMse: event.timeStamp,
        mode: 'up',
        key: event.key,
        isComposing: event.isComposing,
      }),
    );

    /**
     * pointer events (mouse, touch, etc)
     *
     * note
     * - pointer events handle mouse, touch and pen inputs at the same time
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
     * - https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
     * - https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     * - https://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
     *
     * TODO: combine pointer events into gestures
     */
    window.addEventListener('pointermove', (event) =>
      pointerMoveEventsQueue.push({
        pointer: { id: event.pointerId, type: event.pointerType },
        occurredAtMse: event.timeStamp,
        position: { x: event.pageX, y: event.pageY },
      }),
    );
    window.addEventListener('pointerdown', (event) =>
      pointerPressEventsQueue.push({
        occurredAtMse: event.timeStamp,
        mode: 'down',
        pointer: { id: event.pointerId, type: event.pointerType },
        position: { x: event.pageX, y: event.pageY },
        target:
          event.target instanceof Element
            ? getDescriptionOfElement(event.target)
            : undefined,
      }),
    );
    window.addEventListener('pointerup', (event) =>
      pointerPressEventsQueue.push({
        occurredAtMse: event.timeStamp,
        mode: 'up',
        pointer: { id: event.pointerId, type: event.pointerType },
        position: { x: event.pageX, y: event.pageY },
        target:
          event.target instanceof Element
            ? getDescriptionOfElement(event.target)
            : undefined,
      }),
    );

    /**
     * copy, cut, paste events
     *
     * note
     * - fired when the user initiates a copy, cut, or paste action through the browser's user interface.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/copy_event
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/cut_event
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window/paste_event
     */
    window.addEventListener('copy', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.ACTIVITY,
        type: 'activity.clipboard.copy',
        details: null,
      }),
    );
    window.addEventListener('cut', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.ACTIVITY,
        type: 'activity.clipboard.cut',
        details: null,
      }),
    );
    window.addEventListener('paste', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.ACTIVITY,
        type: 'activity.clipboard.paste',
        details: null,
      }),
    );

    /**
     * full screen change
     *
     * note
     * - fired when
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event
     */
    document.addEventListener('fullscreenchange', () =>
      captureAppUsageEvent({
        source: AppUsageEventSource.ACTIVITY,
        type: 'activity.fullscreen.change',
        details: { fullscreen: !!document.fullscreenElement },
      }),
    );

    /**
     * scroll events
     *
     * note
     * - fires when the document view has been scrolled
     * - we must debounce these events and merge them into one summary, as otherwise it is too noisy.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
     *
     * TODO: use `scrollend` event when it has mainstream support
     */
    document.addEventListener('scroll', (event) =>
      scrollEventsQueue.push({
        occurredAtMse: event.timeStamp,
        position: { x: window.scrollX, y: window.scrollY },
      }),
    );

    /**
     * selection events
     *
     * note
     * - fired when the current Selection of a Document is changed.
     *
     * ref
     * - https://developer.mozilla.org/en-US/docs/Web/API/Document/selectionchange_event
     */
    document.addEventListener('selectionchange', (event) =>
      window.getSelection() && window.getSelection()!.toString()
        ? selectionEventsQueue.push({
            occurredAtMse: event.timeStamp,
            selection: window.getSelection()!.toString(),
          })
        : null,
    );
  },
  { cache: createCache() },
);
