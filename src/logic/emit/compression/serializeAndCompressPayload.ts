import pako from 'pako';

/**
 * serializes and subsequently compresses app usage events for storage and transmitting
 *
 * note
 * - serializes w/ JSON.stringify
 * - compresses with pako implementation of zlib
 */
export const serializeAndCompressPayload = (payload: unknown): Uint8Array =>
  pako.deflate(JSON.stringify(payload));
