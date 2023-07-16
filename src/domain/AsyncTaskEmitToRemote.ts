import { DomainEntity } from 'domain-objects';
import { AsyncTask, AsyncTaskStatus } from 'simple-async-tasks';

/**
 * an async task for emitting some data to remote persistance
 */
export interface AsyncTaskEmitToRemote extends AsyncTask {
  uuid?: string;
  updatedAt?: string;
  status: AsyncTaskStatus;

  /**
   * the endpoint to emit the data to
   */
  endpoint: string;

  /**
   * the size of the serialized payload, in char length
   *
   * note
   * - this is added as part of the task for performance monitoring only
   */
  bytes: number;

  /**
   * the serialized payload to emit
   *
   * note
   * - this may be base64 if encoded with pako
   * - this may just be json stringified alternatively
   */
  payload: string;
}
export class AsyncTaskEmitToRemote
  extends DomainEntity<AsyncTaskEmitToRemote>
  implements AsyncTaskEmitToRemote
{
  public static unique = ['endpoint', 'payload'];
}
