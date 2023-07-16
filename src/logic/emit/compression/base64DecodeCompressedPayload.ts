/**
 * decodes base64 encoded a compressed payload
 *
 * usecases
 * - decode stringified events from a persistance layer to...
 *   - send them as binary in a network request (binary takes less space than base64)
 *   - re-inflate the data to see what it was originally
 *
 * ref
 * - https://stackoverflow.com/a/55311625/3068233
 */
export const base64DecodeCompressedPayload = (encoded: string): Uint8Array =>
  new Uint8Array(Buffer.from(encoded, 'base64'));
