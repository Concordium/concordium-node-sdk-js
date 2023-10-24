/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/no-extraneous-dependencies */
import '@stardazed/streams-polyfill';
import '@azure/core-asynciterator-polyfill';

// @ts-ignore
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding.js';
// @ts-ignore
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto.js';

polyfillEncoding();
polyfillCrypto();
