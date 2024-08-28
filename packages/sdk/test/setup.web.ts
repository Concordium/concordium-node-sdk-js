/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed from '@concordium/web-sdk/shims/ed25519';
// self-reference doesn't work in eslint import resolver
import { sha512 } from '@noble/hashes/sha512';
import 'isomorphic-fetch';
import { TextDecoder, TextEncoder } from 'node:util';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

ed.etc.sha512Async = (...m) => Promise.resolve(sha512(ed.etc.concatBytes(...m)));
