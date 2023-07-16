import sizeof from 'object-sizeof';
import pako from 'pako';
import { v4 as uuid } from 'uuid';

import {
  AppUsageEvent,
  AppUsageEventSource,
} from '../../../domain/AppUsageEvent';
import { serializeAndCompressPayload } from './serializeAndCompressPayload';

const exampleEvents = [
  new AppUsageEvent({
    uuid: uuid(),
    occurredAtMse: new Date().getTime(), // TODO: pull off of the event input instead, for better accuracy
    sessionUuid: uuid(),
    route: window.location.href,
    source: AppUsageEventSource.ACTIVITY,
    type: 'test',
    details: null,
  }),
  new AppUsageEvent({
    uuid: uuid(),
    occurredAtMse: new Date().getTime(), // TODO: pull off of the event input instead, for better accuracy
    sessionUuid: uuid(),
    route: window.location.href,
    source: AppUsageEventSource.ACTIVITY,
    type: 'test',
    details: { some: 'thing' },
  }),
];

describe('serializeAndCompressAppUsageEvents', () => {
  it('should be able to serialize and compress events', () => {
    const compressed = serializeAndCompressPayload(exampleEvents);
    expect(compressed).toBeInstanceOf(Uint8Array);
  });
  it('should produce equivalent values when compressed and decompressed roundtrip', () => {
    const compressed = serializeAndCompressPayload(exampleEvents);
    const decompressed = pako.inflate(compressed, { to: 'string' });
    expect(decompressed).toEqual(JSON.stringify(exampleEvents));
  });
  it('should save size after compression', () => {
    const originalSize = sizeof([
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
      ...exampleEvents,
    ]);
    const compressedSize = sizeof(serializeAndCompressPayload(exampleEvents));
    console.log({ originalSize, compressedSize });
    expect(originalSize).toBeGreaterThan(compressedSize);
  });
});
