import pako from 'pako';
import { v4 as uuid } from 'uuid';

import {
  AppUsageEvent,
  AppUsageEventSource,
} from '../../../domain/AppUsageEvent';
import { base64DecodeCompressedPayload } from './base64DecodeCompressedPayload';
import { base64EncodeCompressedPayload } from './base64EncodeCompressedPayload';
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

describe('base64EncodeCompressedPayload', () => {
  it('should be able to encode the compressed events', () => {
    const compressed = serializeAndCompressPayload(exampleEvents);
    const encoded = base64EncodeCompressedPayload(compressed);
    console.log(encoded);
  });
  it('should produce equivalent values when encoded and decoded roundtrip', () => {
    const compressed = serializeAndCompressPayload(exampleEvents);
    const encoded = base64EncodeCompressedPayload(compressed);
    const decoded = base64DecodeCompressedPayload(encoded);
    expect(decoded).toEqual(compressed);

    // bonus: can decode back to original value
    const decompressed = pako.inflate(decoded, { to: 'string' });
    expect(decompressed).toEqual(JSON.stringify(exampleEvents));
  });
});
