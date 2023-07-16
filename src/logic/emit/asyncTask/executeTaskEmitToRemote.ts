import {
  AsyncTaskStatus,
  withAsyncTaskExecutionLifecycleExecute,
} from 'simple-async-tasks';
import { HasMetadata } from 'type-fns';

import { AsyncTaskEmitToRemote } from '../../../domain/AsyncTaskEmitToRemote';
import { base64DecodeCompressedPayload } from '../compression/base64DecodeCompressedPayload';
import { fetchAgainstRemote } from '../fetchAgainstRemote';
import { daoTaskEmitToRemote } from './daoTaskEmitToRemote';

export const executeTaskEmitToRemote = withAsyncTaskExecutionLifecycleExecute(
  async ({ task }: { task: HasMetadata<AsyncTaskEmitToRemote> }) => {
    // emit the data
    await fetchAgainstRemote({
      version: 1,
      endpoint: task.endpoint,
      payload: base64DecodeCompressedPayload(task.payload), // TODO: support payloads that weren't base64 encoded
    });

    // mark it as fulfilled
    await daoTaskEmitToRemote.upsert({
      task: { ...task, status: AsyncTaskStatus.FULFILLED },
    });
  },
  {
    dao: daoTaskEmitToRemote,
  },
);
