/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextEncoder, TextDecoder } from 'node:util';
import 'isomorphic-fetch';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
