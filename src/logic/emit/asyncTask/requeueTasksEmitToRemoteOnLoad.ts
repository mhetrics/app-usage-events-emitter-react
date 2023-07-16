import { AsyncTaskStatus } from 'simple-async-tasks';

import { daoTaskEmitToRemote } from './daoTaskEmitToRemote';
import { asyncTaskEmitToRemoteQueue } from './queueTaskEmitToRemote';

/**
 * a method which can be used to requeue all tasks saved in the dao on browser page load
 *
 * usecases
 * - requeue all tasks into memory after page reload
 *
 * note
 * - this is intended to be called inside of the provider on page load
 */
export const requeueTasksEmitToRemoteOnLoad = async () => {
  // look up all tasks matching in progress statuses
  const tasksToRequeue = await daoTaskEmitToRemote.findAllByStatus({
    status: [
      AsyncTaskStatus.QUEUED, // ones that were queued
      AsyncTaskStatus.ATTEMPTED, // ones that never left the "attempted" state (e.g., browser disconnected while attempting)
      AsyncTaskStatus.FAILED, // ones that had failed
    ],
  });

  // requeue them all
  asyncTaskEmitToRemoteQueue.push(tasksToRequeue);
};
