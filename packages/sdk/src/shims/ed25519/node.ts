// To add support for node versions <19.
// From https://www.npmjs.com/package/@noble/ed25519#usage
import { webcrypto } from 'node:crypto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// eslint-disable-next-line import/export
export * from '@noble/ed25519';
