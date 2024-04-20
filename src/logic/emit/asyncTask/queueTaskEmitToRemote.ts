import {
  AsyncTaskStatus,
  withAsyncTaskExecutionLifecycleEnqueue,
} from 'simple-async-tasks';
import { createQueueWithResilientRemoteConsumer } from 'simple-in-memory-queue';
import { HasMetadata } from 'type-fns';

import { AsyncTaskEmitToRemote } from '../../../domain/AsyncTaskEmitToRemote';
import { daoTaskEmitToRemote } from './daoTaskEmitToRemote';
import { executeTaskEmitToRemote } from './executeTaskEmitToRemote';

export const asyncTaskEmitToRemoteQueue =
  createQueueWithResilientRemoteConsumer<AsyncTaskEmitToRemote>({
    consumer: async ({ item }) => {
      await executeTaskEmitToRemote({
        task: item as HasMetadata<AsyncTaskEmitToRemote>,
      });
    },
    threshold: {
      concurrency: 1,
      retry: 3, // retry each task up to 3 times
      pause: 5, // pause all consumption if 5 tasks in a row fail
    },
    delay: {
      retry: 1000,
      visibility: 1000,
    },
    on: {
      failureAttempt: ({ item, attempt, error }) =>
        console.warn('🤔 failed attempting to emit to remote', {
          item,
          attempt,
          error,
        }),
      failurePermanent: ({ item, error }) =>
        console.warn('😞 failed permanently to emit to remote', {
          item,
          error,
        }),
      pause: ({ failures }) =>
        console.warn(
          '🛑 failed too many tasks in a row, pausing emit to remote',
          {
            failures,
          },
        ),
    },
  });

export const queueTaskEmitToRemote = withAsyncTaskExecutionLifecycleEnqueue({
  dao: daoTaskEmitToRemote,
  queue: asyncTaskEmitToRemoteQueue,
  getNew: ({ endpoint, payload }) =>
    new AsyncTaskEmitToRemote({
      status: AsyncTaskStatus.QUEUED,
      endpoint,
      bytes: new Blob([payload]).size, // https://stackoverflow.com/a/52254083/3068233
      payload,
    }),
  log: console,
});
