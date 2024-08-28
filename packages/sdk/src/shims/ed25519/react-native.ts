// We need sync methods for react native support.
// https://www.npmjs.com/package/@noble/ed25519#usage
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

ed.etc.sha512Async = (...m) => Promise.resolve(sha512(ed.etc.concatBytes(...m)));

export * from '@noble/ed25519';
