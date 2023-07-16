import { omitMetadataValues } from 'domain-objects';
import { AsyncTaskStatus } from 'simple-async-tasks';
import { v4 as uuid } from 'uuid';

import { AsyncTaskEmitToRemote } from '../../../domain/AsyncTaskEmitToRemote';
import { daoTaskEmitToRemote } from './daoTaskEmitToRemote';

// mock out localstorage since we're basing our dao based on a localstorage cache
const mockStore: Record<string, string> = {};
const mockGetItem = jest.fn((key: string) => mockStore[key]);
const mockSetItem = jest.fn(
  (key: string, value: string) => (mockStore[key] = value),
);
const mockRemoveItem = jest.fn((key: string) => {
  delete mockStore[key];
});
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  },
});

describe('daoTaskEmitToRemote', () => {
  it('should be able to upsert', async () => {
    const task = new AsyncTaskEmitToRemote({
      status: AsyncTaskStatus.QUEUED,
      endpoint: '/session',
      bytes: 7,
      payload: uuid(),
    });
    await daoTaskEmitToRemote.upsert({ task });
  });
  it('should be able to find by unique', async () => {
    const task = new AsyncTaskEmitToRemote({
      status: AsyncTaskStatus.QUEUED,
      endpoint: '/session',
      bytes: 7,
      payload: uuid(),
    });
    await daoTaskEmitToRemote.upsert({ task });
    const taskFound = await daoTaskEmitToRemote.findByUnique(task);
    expect(omitMetadataValues(taskFound!)).toEqual(omitMetadataValues(task));
  });
});
