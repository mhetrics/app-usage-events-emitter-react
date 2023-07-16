import { createQueueWithBatchConsumer } from 'simple-in-memory-queue';

import { SESSION_LAST_USE_KEY } from './findOrCreateAppUsageSession';

export interface SessionLastUsedAtEvent {
  sessionUuid: string;
  lastUsedAtMse: number;
}
const sessionLastUsedAtEventQueue =
  createQueueWithBatchConsumer<SessionLastUsedAtEvent>({
    threshold: { milliseconds: 100, size: 100 },
    consumer: ({ items }) =>
      localStorage.setItem(
        SESSION_LAST_USE_KEY,
        JSON.stringify({ ...items.slice(-1)[0] }),
      ),
  });

/**
 * exposes a simple way to capture the last time a session was used
 */
export const captureSessionLastUsedAt = (event: SessionLastUsedAtEvent) =>
  sessionLastUsedAtEventQueue.push(event);
