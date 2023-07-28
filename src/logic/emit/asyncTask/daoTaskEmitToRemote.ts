import { sha256 } from 'cross-sha256';
import { deserialize, serialize } from 'domain-objects';
import { AsyncTaskDao, AsyncTaskStatus } from 'simple-async-tasks';
import { createCache } from 'simple-localstorage-cache';
import { HasMetadata, isPresent } from 'type-fns';
import { v4 as uuid } from 'uuid';

import { AsyncTaskEmitToRemote } from '../../../domain/AsyncTaskEmitToRemote';

const castToSha256 = (str: string) => new sha256().update(str).digest('hex');

type AsyncTaskEmitToRemoteDao = AsyncTaskDao<
  AsyncTaskEmitToRemote,
  Pick<AsyncTaskEmitToRemote, 'endpoint' | 'payload'>,
  undefined
> & {
  findAllByStatus: (byStatus: {
    status: string[];
  }) => Promise<HasMetadata<AsyncTaskEmitToRemote>[]>;
};

const cache = createCache({
  namespace: 'aue-tasks-emit',
  defaultSecondsUntilExpiration: null, // never expire, they'll be manually set to expire once fulfilled (in the upsert function)
});

const getCacheKey = ({
  endpoint,
  payload,
}: {
  endpoint: string;
  payload: string | Buffer;
}) => castToSha256(serialize({ endpoint, payload }));

const findByUnique: AsyncTaskEmitToRemoteDao['findByUnique'] = async ({
  endpoint,
  payload,
}) => {
  const cacheKey = getCacheKey({ endpoint, payload });
  const cachedValue = await cache.get(cacheKey);
  if (!cachedValue) return null;
  return new AsyncTaskEmitToRemote(
    JSON.parse(cachedValue),
  ) as HasMetadata<AsyncTaskEmitToRemote>;
};

/**
 * method for finding all tasks matching included statuses
 *
 * note:
 * - current implementation does not index by status, since the total number of keys should always be small
 */
const findAllByStatus: AsyncTaskEmitToRemoteDao['findAllByStatus'] = async ({
  status,
}) => {
  const keysAll = await cache.keys();
  const tasksAll = (await Promise.all(keysAll.map((key) => cache.get(key))))
    .filter(isPresent)
    .map(
      (taskJSON) =>
        new AsyncTaskEmitToRemote(
          JSON.parse(taskJSON),
        ) as HasMetadata<AsyncTaskEmitToRemote>,
    );
  const tasksMatching = tasksAll.filter((task) => status.includes(task.status));
  return tasksMatching;
};

const upsert: AsyncTaskEmitToRemoteDao['upsert'] = async ({ task }) => {
  // find or create the metadata for this object by unique key
  const foundObject = await findByUnique(task);
  const metadata = (() => {
    if (foundObject) return { uuid: foundObject.uuid };
    return { uuid: uuid() };
  })();

  // upsert the object
  const cacheKey = getCacheKey(task);
  const taskWithMetadata = new AsyncTaskEmitToRemote({
    ...task,
    ...metadata,
    updatedAt: new Date().toISOString(),
  }) as HasMetadata<AsyncTaskEmitToRemote>;
  await cache.set(cacheKey, serialize(taskWithMetadata), {
    secondsUntilExpiration:
      taskWithMetadata.status === AsyncTaskStatus.FULFILLED ? 15 : 0, // if fulfilled, set to remove it from cache in 60 seconds
  });
  return taskWithMetadata;
};

export const daoTaskEmitToRemote: AsyncTaskEmitToRemoteDao = {
  findAllByStatus,
  findByUnique,
  upsert,
};
