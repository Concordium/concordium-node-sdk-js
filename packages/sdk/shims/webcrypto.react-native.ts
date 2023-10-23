import crypto from 'isomorphic-webcrypto';

await crypto.ensureSecure();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = crypto;
