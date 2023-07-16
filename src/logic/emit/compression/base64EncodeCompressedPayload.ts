/**
 * base64 encodes a compressed payload
 *
 * usecases
 * - stringifies the binary compressed data for storage
 *
 * ref
 * - https://stackoverflow.com/a/55311625/3068233
 */
export const base64EncodeCompressedPayload = (payload: Uint8Array) =>
  Buffer.from(payload).toString('base64');
